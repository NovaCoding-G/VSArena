// Assumption: standalone Node process for live matches. PORT (cloud) or HARNESS_PORT (local, default 8787).
// Agent socket = judge. /spectate = read-only fan-out for the website (no actions, no ELO writes).

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
import {
  isSpectatePath,
  snapshotToSpectateFrame,
  type SpectateFrameMessage,
  type SpectateMessage,
} from "../lib/harness/spectate";
import { parseActionContract } from "../lib/eval/actionSchema";
import { buildProvenance, gitSha, latencyBudgetMs, policyHz } from "../lib/eval/provenance";
import { PHYSICS_HZ, PRODUCT_VERSION, RAPIER_VERSION } from "../lib/eval/product";
import { buildReplayArtifact, maybeRecordReplaySample, type ReplaySample } from "../lib/eval/replay";
import { resolveScene } from "../lib/eval/scenes";
import {
  INVALID_ACTION_BUDGET,
  emptyCounters,
  harnessError,
  matchFailure,
  officialMatchStatus,
  shouldIngestOfficialResult,
  timeoutStrikeBudget,
  type EvalCounters,
  type FailureCode,
} from "../lib/eval/taxonomy";
import { VLA_ACTION_TIMEOUT_MS, VLA_POLICY_HZ } from "../lib/vision/raster";
import { verifyHarnessApiKey } from "./verifyApiKey";
import { ingestOfficialResult } from "./ingestResult";

const PORT = Number(process.env.PORT ?? process.env.HARNESS_PORT ?? 8787);
const STATE_STEP = 1 / HARNESS_TICK_HZ;
const VLA_STEP = 1 / VLA_POLICY_HZ;
/** State track is 20 Hz; fans out at half rate to keep spectate light. */
const SPECTATE_STATE_EVERY = 2;

/** MVP: one Rapier world at a time on a free VM. */
let matchBusy = false;

const spectators = new Set<WebSocket>();
let lastSpectateFrame: SpectateFrameMessage | null = null;

const server = createServer((req, res) => {
  void handleHttp(req, res);
});

const wss = new WebSocketServer({ server });

server.listen(PORT, "0.0.0.0", () => {
  const prod = process.env.NODE_ENV === "production";
  console.log(`[vsarena-harness] http://0.0.0.0:${PORT}/health`);
  console.log(`[vsarena-harness] ws://0.0.0.0:${PORT} (agent)`);
  console.log(`[vsarena-harness] ws://0.0.0.0:${PORT}/spectate (read-only)`);
  console.log(`[vsarena-harness] eval ${PRODUCT_VERSION} rapier ${RAPIER_VERSION} sha=${gitSha().slice(0, 8)}`);
  if (prod) console.log("[vsarena-harness] NODE_ENV=production — api_key lookup required");
});

wss.on("connection", (socket, req) => {
  const path = (req.url ?? "/").split("?")[0] ?? "/";
  if (isSpectatePath(path)) {
    handleSpectate(socket);
    return;
  }
  void handleConnection(socket).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "connection failed";
    const code: FailureCode = message.includes("hello timeout")
      ? "protocol.hello_timeout"
      : "harness.disconnect";
    safeSend(socket, harnessError(code, message, code === "protocol.hello_timeout"));
    socket.close();
  });
});

/**
 * Health for reverse proxies / cloud probes (+ eval provenance).
 *
 * @example GET /health → { ok: true, busy: false }
 */
function handleHttp(req: IncomingMessage, res: ServerResponse): void {
  const path = (req.url ?? "/").split("?")[0];
  if (req.method === "GET" && (path === "/health" || path === "/")) {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    const live = lastSpectateFrame
      ? {
          match_id: lastSpectateFrame.match_id,
          agent: lastSpectateFrame.agent,
          mode: lastSpectateFrame.mode,
          tick: lastSpectateFrame.tick,
        }
      : null;
    const sampleScene = resolveScene({ matchId: "health" });
    res.end(
      JSON.stringify({
        ok: true,
        busy: matchBusy,
        live,
        spectators: spectators.size,
        eval: {
          product: PRODUCT_VERSION,
          rapier: RAPIER_VERSION,
          physics_hz: PHYSICS_HZ,
          git_sha: gitSha(),
          scene_set: sampleScene.set,
          latency_budget_ms: { vla: VLA_ACTION_TIMEOUT_MS, state: ACTION_TIMEOUT_MS },
          policy_hz: { vla: VLA_POLICY_HZ, state: HARNESS_TICK_HZ },
        },
      }),
    );
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "not found" }));
}

/**
 * Read-only watchers. Ignore inbound messages; never write ELO.
 */
function handleSpectate(socket: WebSocket): void {
  spectators.add(socket);
  if (lastSpectateFrame && matchBusy) {
    safeSend(socket, lastSpectateFrame);
  } else {
    safeSend(socket, { type: "spectate_idle", busy: false } satisfies SpectateMessage);
  }
  const drop = () => {
    spectators.delete(socket);
  };
  socket.on("close", drop);
  socket.on("error", drop);
  socket.on("message", () => {
    // Spectators cannot send actions.
  });
}

function broadcastSpectate(payload: SpectateMessage): void {
  if (payload.type === "spectate_frame") {
    lastSpectateFrame = payload;
  }
  if (payload.type === "spectate_idle" || payload.type === "spectate_result") {
    lastSpectateFrame = null;
  }
  for (const spec of spectators) {
    safeSend(spec, payload);
  }
}

async function handleConnection(socket: WebSocket): Promise<void> {
  if (matchBusy) {
    safeSend(socket, harnessError("harness.busy", "one live match at a time; retry shortly", true));
    socket.close();
    return;
  }

  const hello = await waitForHello(socket);
  if (!hello.api_key) {
    safeSend(socket, harnessError("protocol.api_key_required", "api_key required"));
    socket.close();
    return;
  }
  if (hello.task && hello.task !== "block_stacking") {
    safeSend(socket, harnessError("protocol.invalid_task", "MVP only supports task=block_stacking"));
    socket.close();
    return;
  }

  matchBusy = true;
  let agentName = "unknown";

  try {
    const auth = await verifyHarnessApiKey(hello.api_key);
    if (!auth.ok) {
      const code: FailureCode =
        auth.reason.includes("misconfigured") || auth.reason.includes("service role")
          ? "harness.misconfigured"
          : "protocol.invalid_api_key";
      safeSend(socket, harnessError(code, auth.reason));
      socket.close();
      return;
    }

    const mode: ObservationMode = hello.mode === "state" ? "state" : "vla";
    agentName = (hello.agent ?? auth.username).trim() || auth.username;
    const step = mode === "vla" ? VLA_STEP : STATE_STEP;
    const physSteps = Math.max(1, Math.round(step / FIXED_DT));
    const actionTimeout = latencyBudgetMs(mode);
    const timeoutBudget = timeoutStrikeBudget(mode);

    const matchId = globalThis.crypto.randomUUID();
    const scene = resolveScene({ matchId });
    const counters: EvalCounters = emptyCounters();
    const replaySamples: ReplaySample[] = [];

    console.log(
      `[vsarena-harness] match start user=${auth.username} mode=${mode} agent=${agentName} scene=${scene.id} hz=${policyHz(mode)}`,
    );

    let sim: ArenaSimulation | null = null;
    let closed = false;
    let lastAction: ActionMessage["action"] | null = null;
    let lastActionAt = Date.now();
    let spectateCounter = 0;

    const onMessage = (data: WebSocket.RawData) => {
      const parsed = parseHarnessMessage(String(data));
      if (!isActionMessage(parsed)) {
        if (parsed && typeof parsed === "object" && (parsed as { type?: string }).type === "action") {
          counters.invalid_actions += 1;
          safeSend(socket, harnessError("protocol.schema_violation", "malformed action envelope", true));
        }
        return;
      }
      if (parsed.match_id !== matchId) return;
      const contract = parseActionContract(parsed.action);
      if (!contract.ok) {
        counters.invalid_actions += 1;
        safeSend(socket, harnessError("protocol.invalid_action", contract.reason, true));
        return;
      }
      lastAction = contract.action;
      lastActionAt = Date.now();
      counters.consecutive_timeouts = 0;
    };

    socket.on("message", onMessage);
    socket.on("close", () => {
      closed = true;
    });
    socket.on("error", () => {
      closed = true;
    });

    try {
      sim = await ArenaSimulation.create({ spawns: scene.spawns });
      const tracker = createTorqueTracker();

      while (!closed && socket.readyState === socket.OPEN) {
        if (counters.invalid_actions >= INVALID_ACTION_BUDGET) {
          await finishMatch({
            socket,
            sim,
            tracker,
            matchId,
            agentName,
            mode,
            scene,
            counters,
            replaySamples,
            disconnected: false,
            timeoutBudget,
          });
          break;
        }

        const snapshot = sim.getCurrentSnapshot();
        maybeRecordReplaySample(replaySamples, snapshot, mode);
        const cap = mode === "vla" ? VLA_MATCH_MAX_TICKS : MATCH_MAX_TICKS;
        const overtime = snapshot.tick >= cap;
        const holding = snapshot.graspedBlockId !== null;
        const stacked = taskCompletion(snapshot.blocks, snapshot.graspedBlockId) >= 1 && !holding;
        if (stacked) {
          await finishMatch({
            socket,
            sim,
            tracker,
            matchId,
            agentName,
            mode,
            scene,
            counters,
            replaySamples,
            disconnected: false,
            timeoutBudget,
          });
          break;
        }
        if (counters.consecutive_timeouts >= timeoutBudget) {
          await finishMatch({
            socket,
            sim,
            tracker,
            matchId,
            agentName,
            mode,
            scene,
            counters,
            replaySamples,
            disconnected: false,
            timeoutBudget,
          });
          break;
        }
        if ((overtime && !holding) || snapshot.tick >= cap + MATCH_GRASP_GRACE_TICKS) {
          await finishMatch({
            socket,
            sim,
            tracker,
            matchId,
            agentName,
            mode,
            scene,
            counters,
            replaySamples,
            disconnected: false,
            timeoutBudget,
          });
          break;
        }

        const state = snapshotToState(snapshot, matchId, snapshot.tick, { mode });
        safeSend(socket, state);

        spectateCounter += 1;
        const emitSpectate = mode === "vla" || spectateCounter % SPECTATE_STATE_EVERY === 0;
        if (emitSpectate) {
          broadcastSpectate(snapshotToSpectateFrame(snapshot, matchId, agentName, mode));
        }

        if (Date.now() - lastActionAt > actionTimeout) {
          counters.action_timeouts += 1;
          counters.consecutive_timeouts += 1;
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

      if (closed && sim) {
        maybeRecordReplaySample(replaySamples, sim.getCurrentSnapshot(), mode);
        // Disconnect: taxonomy only, no ELO (cannot tell policy crash from network).
        console.log(`[vsarena-harness] abort harness.disconnect agent=${agentName} scene=${scene.id}`);
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
    broadcastSpectate({ type: "spectate_idle", busy: false });
  }
}

async function finishMatch(input: {
  socket: WebSocket;
  sim: ArenaSimulation;
  tracker: ReturnType<typeof createTorqueTracker>;
  matchId: string;
  agentName: string;
  mode: ObservationMode;
  scene: ReturnType<typeof resolveScene>;
  counters: EvalCounters;
  replaySamples: ReplaySample[];
  disconnected: boolean;
  timeoutBudget: number;
}): Promise<void> {
  const snapshot = input.sim.getCurrentSnapshot();
  maybeRecordReplaySample(input.replaySamples, snapshot, input.mode);
  const scores = scoreMatch(snapshot.blocks, input.tracker, snapshot.graspedBlockId);
  const failure = matchFailure({
    completion: scores.task_completion_score,
    consecutiveTimeouts: input.counters.consecutive_timeouts,
    timeoutBudget: input.timeoutBudget,
    invalidActions: input.counters.invalid_actions,
    invalidBudget: INVALID_ACTION_BUDGET,
    disconnected: input.disconnected,
  });
  const status = officialMatchStatus(failure.code);
  const provenance = buildProvenance({
    mode: input.mode,
    scene: {
      set: input.scene.set,
      id: input.scene.id,
      seed: input.scene.seed,
      hash: input.scene.hash,
      private_override: input.scene.private_override,
    },
    counters: input.counters,
  });
  const result: ResultMessage = {
    type: "result",
    match_id: input.matchId,
    status,
    scores: {
      spatial_accuracy: scores.spatial_accuracy,
      task_completion_score: scores.task_completion_score,
      joint_torque_telemetry: scores.joint_torque_telemetry,
    },
    elo_delta: 0,
    failure,
    provenance,
  };
  result.replay = buildReplayArtifact({
    matchId: input.matchId,
    agent: input.agentName,
    provenance,
    failure,
    scores: result.scores,
    status,
    samples: input.replaySamples,
  });

  if (shouldIngestOfficialResult(failure)) {
    await ingestOfficialResult(input.agentName, result);
  }
  safeSend(input.socket, result);
  broadcastSpectate({
    type: "spectate_result",
    match_id: input.matchId,
    agent: input.agentName,
    status: result.status,
    scores: result.scores,
    elo_delta: result.elo_delta,
  });
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
