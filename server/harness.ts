// Assumption: standalone Node process for MVP live matches. Default port 8787.

import "./loadEnv";
import { WebSocketServer, type WebSocket } from "ws";
import { ACTION_TIMEOUT_MS, FIXED_DT, HARNESS_TICK_HZ, MATCH_GRASP_GRACE_TICKS, MATCH_MAX_TICKS, VLA_MATCH_MAX_TICKS } from "../simulation/constants";
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

const PORT = Number(process.env.HARNESS_PORT ?? 8787);
const STATE_STEP = 1 / HARNESS_TICK_HZ;
const VLA_STEP = 1 / VLA_POLICY_HZ;

const wss = new WebSocketServer({ port: PORT });
console.log(`[vsarena-harness] ws://127.0.0.1:${PORT}`);

wss.on("connection", (socket) => {
  void handleConnection(socket).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "connection failed";
    safeSend(socket, { type: "error", message, recoverable: false });
    socket.close();
  });
});

async function handleConnection(socket: WebSocket): Promise<void> {
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

  const auth = await verifyHarnessApiKey(hello.api_key);
  if (!auth.ok) {
    safeSend(socket, { type: "error", message: auth.reason, recoverable: false });
    socket.close();
    return;
  }

  const mode: ObservationMode = hello.mode === "state" ? "state" : "vla";
  const agentName = (hello.agent ?? auth.username).trim() || auth.username;
  const step = mode === "vla" ? VLA_STEP : STATE_STEP;
  const physSteps = Math.max(1, Math.round(step / FIXED_DT));
  const actionTimeout = mode === "vla" ? VLA_ACTION_TIMEOUT_MS : ACTION_TIMEOUT_MS;

  console.log(`[vsarena-harness] match start user=${auth.username} mode=${mode} agent=${agentName}`);

  const matchId = globalThis.crypto.randomUUID();
  const sim = await ArenaSimulation.create();
  const tracker = createTorqueTracker();
  let lastAction: ActionMessage["action"] | null = null;
  let lastActionAt = Date.now();
  let closed = false;

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
    sim.setAgentCommand(null);
    sim.dispose();
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
