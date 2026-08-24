// Assumption: standalone Node process for live matches. PORT (cloud) or HARNESS_PORT (local, default 8787).

import "./loadEnv";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import {
  ACTION_TIMEOUT_MS,
  FIXED_DT,
  HARNESS_TICK_HZ,
  MATCH_GRASP_GRACE_TICKS,
  MATCH_MAX_TICKS,
  VLA_MATCH_MAX_TICKS,
} from "../simulation/constants";
import { ArenaSimulation } from "../simulation/rapierWorld";
import { createTorqueTracker, scoreMatch, sampleTorque, taskCompletion } from "../lib/scoring";
import {
  applyAgentAction,
  isActionMessage,
  isHelloMessage,
  parseHarnessMessage,
  snapshotToState,
} from "../lib/harness/codec";
import type { ActionMessage, HelloMessage, ObservationMode, ResultMessage } from "../lib/harness/protocol";
import { VLA_ACTION_TIMEOUT_MS, VLA_POLICY_HZ } from "../lib/vision/raster";
import { verifyHarnessApiKey } from "./verifyApiKey";
import { ingestOfficialResult } from "./ingestResult";

const PORT = Number(process.env.PORT ?? process.env.HARNESS_PORT ?? 8787);
const STATE_STEP = 1 / HARNESS_TICK_HZ;
const VLA_STEP = 1 / VLA_POLICY_HZ;

/** MVP: one Rapier world at a time on a free VM. */
let matchBusy = false;

const server = createServer((req, res) => {
  void handleHttp(req, res);
});

const wss = new WebSocketServer({ server });

server.listen(PORT, "0.0.0.0", () => {
  const prod = process.env.NODE_ENV === "production";
  console.log(`[vsarena-harness] http://0.0.0.0:${PORT}/health`);
  console.log(`[vsarena-harness] ws://0.0.0.0:${PORT} (behind TLS: wss://…)`);
  if (prod) console.log("[vsarena-harness] NODE_ENV=production — api_key lookup required");
});

wss.on("connection", (socket) => {
  void handleConnection(socket).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "connection failed";
    safeSend(socket, { type: "error", message, recoverable: false });
    socket.close();
  });
});

/**
 * Health for reverse proxies / cloud probes.
 *
 * @example GET /health → { ok: true, busy: false }
 */
function handleHttp(req: IncomingMessage, res: ServerResponse): void {
  const path = (req.url ?? "/").split("?")[0];
  if (req.method === "GET" && (path === "/health" || path === "/")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, busy: matchBusy }));
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "not found" }));
}

async function handleConnection(socket: WebSocket): Promise<void> {
  if (matchBusy) {
    safeSend(socket, {
      type: "error",
      message: "harness busy — one live match at a time; retry shortly",
      recoverable: true,
    });
    socket.close();
    return;
  }

  const hello = await waitForHello(socket);
  if (!hello.api_key) {
    safeSend(socket, { type: "error", message: "api_key required", recoverable: false });
    socket.close();
    return;
  }
  if (hello.task && hello.task !== "block_stacking") {
    safeSend(socket, { type: "error", message: "MVP only supports task=block_stacking", recoverable: false });
    socket.close();
    return;
  }

  // Reserve before auth / Rapier boot so a second client sees busy immediately.
  matchBusy = true;
  let agentName = "unknown";

  try {
    const auth = await verifyHarnessApiKey(hello.api_key);
    if (!auth.ok) {
      safeSend(socket, { type: "error", message: auth.reason, recoverable: false });
      socket.close();
      return;
    }

    const mode: ObservationMode = hello.mode === "state" ? "state" : "vla";
    agentName = (hello.agent ?? auth.username).trim() || auth.username;
    const step = mode === "vla" ? VLA_STEP : STATE_STEP;
    const physSteps = Math.max(1, Math.round(step / FIXED_DT));
    const actionTimeout = mode === "vla" ? VLA_ACTION_TIMEOUT_MS : ACTION_TIMEOUT_MS;

    console.log(`[vsarena-harness] match start user=${auth.username} mode=${mode} agent=${agentName}`);

    const matchId = globalThis.crypto.randomUUID();
    let sim: ArenaSimulation | null = null;
    let closed = false;
    let lastAction: ActionMessage["action"] | null = null;
    let lastActionAt = Date.now();

    const onMessage = (data: WebSocket.RawData) => {
      const parsed = parseHarnessMessage(String(data));
      if (!isActionMessage(parsed)) return;
      if (parsed.match_id !== matchId) return;
      lastAction = parsed.action;
      lastActionAt = Date.now();
    };

    socket.on("message", onMessage);
    socket.on("close", () => {
      closed = true;
    });
    socket.on("error", () => {
      closed = true;
    });

    try {
      sim = await ArenaSimulation.create();
      const tracker = createTorqueTracker();

      while (!closed && socket.readyState === socket.OPEN) {
        const snapshot = sim.getCurrentSnapshot();
        const cap = mode === "vla" ? VLA_MATCH_MAX_TICKS : MATCH_MAX_TICKS;
        const overtime = snapshot.tick >= cap;
        const holding = snapshot.graspedBlockId !== null;
        if (
          (taskCompletion(snapshot.blocks, snapshot.graspedBlockId) >= 1 && !holding) ||
          (overtime && !holding) ||
          snapshot.tick >= cap + MATCH_GRASP_GRACE_TICKS
        ) {
          const scores = scoreMatch(snapshot.blocks, tracker, snapshot.graspedBlockId);
          const result: ResultMessage = {
            type: "result",
            match_id: matchId,
            status: "completed",
            scores: {
              spatial_accuracy: scores.spatial_accuracy,
              task_completion_score: scores.task_completion_score,
              joint_torque_telemetry: scores.joint_torque_telemetry,
            },
            elo_delta: 0,
          };
          await ingestOfficialResult(agentName, result);
          safeSend(socket, result);
          break;
        }

        const state = snapshotToState(snapshot, matchId, snapshot.tick, { mode });
        safeSend(socket, state);

        if (Date.now() - lastActionAt > actionTimeout) {
          lastAction = lastAction ?? {
            joint_targets: { ...state.scene.joint_states },
            gripper_state: "open",
          };
        }

        if (lastAction) {
          const prev = snapshot.joints;
          const joints = applyAgentAction(snapshot, lastAction);
          sim.setAgentCommand({ joints, gripperClosed: lastAction.gripper_state === "closed" });
          sampleTorque(tracker, prev, joints);
        }

        for (let i = 0; i < physSteps; i += 1) {
          sim.step(FIXED_DT, { held: {}, gripperToggleQueued: false, resetQueued: false });
        }

        await sleep(step * 1000);
      }
    } finally {
      socket.off("message", onMessage);
      if (sim) {
        sim.setAgentCommand(null);
        sim.dispose();
      }
      console.log(`[vsarena-harness] match end agent=${agentName}`);
    }
  } finally {
    matchBusy = false;
  }
}

function waitForHello(socket: WebSocket): Promise<HelloMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("hello timeout")), 5000);
    const onMessage = (data: WebSocket.RawData) => {
      const parsed = parseHarnessMessage(String(data));
      if (!isHelloMessage(parsed)) return;
      clearTimeout(timer);
      socket.off("message", onMessage);
      resolve(parsed);
    };
    socket.on("message", onMessage);
    socket.once("close", () => {
      clearTimeout(timer);
      reject(new Error("socket closed before hello"));
    });
  });
}

function safeSend(socket: WebSocket, payload: unknown): void {
  if (socket.readyState !== socket.OPEN) return;
  try {
    socket.send(JSON.stringify(payload));
  } catch {
    // Drop on a dead socket; the close handler tears down the match.
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
