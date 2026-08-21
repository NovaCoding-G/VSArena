import { MATCH_GRASP_GRACE_TICKS, MATCH_MAX_TICKS, VLA_MATCH_MAX_TICKS } from "@/simulation/constants";
import { DEFAULT_JOINTS } from "@/simulation/constants";
import type { ArenaSimulation } from "@/simulation/rapierWorld";
import type { JointState } from "@/simulation/types";
import { createTorqueTracker, scoreMatch, sampleTorque, taskCompletion, type MatchScores } from "@/lib/scoring";
import { BaselineIK } from "@/lib/agents/baselineIk";
import { ColorSeek } from "@/lib/agents/colorSeek";
import { applyAgentAction, snapshotToState } from "@/lib/harness/codec";
import type { Agent, ObservationMode, ResultMessage } from "@/lib/harness/protocol";
import { VLA_POLICY_HZ } from "@/lib/vision/raster";

const PHYS_HZ = 60;
const VLA_STRIDE = Math.max(1, Math.round(PHYS_HZ / VLA_POLICY_HZ));

export interface LocalMatch {
  matchId: string;
  agent: Agent & { lastPlan: string; reset?: () => void };
  mode: ObservationMode;
  tracker: ReturnType<typeof createTorqueTracker>;
  lastPlan: string;
  prevJoints: JointState;
  stackedHold: number;
}

/**
 * In-browser match. `state` = Baseline-IK with poses. `vla` = ColorSeek on the RGB track.
 *
 * @example createLocalMatch("vla")
 */
export function createLocalMatch(mode: ObservationMode = "state"): LocalMatch {
  const matchId = globalThis.crypto?.randomUUID?.() ?? `match-${Date.now()}`;
  const agent = mode === "vla" ? new ColorSeek() : new BaselineIK();
  return {
    matchId,
    agent,
    mode,
    tracker: createTorqueTracker(),
    lastPlan: mode === "vla" ? "ColorSeek engaged" : "Baseline-IK engaged",
    prevJoints: { ...DEFAULT_JOINTS },
    stackedHold: 0,
  };
}

/**
 * One evaluation tick AFTER physics has stepped. Sets the next agent command.
 *
 * @example const result = stepLocalMatch(match, sim)
 */
export function stepLocalMatch(match: LocalMatch, sim: ArenaSimulation): ResultMessage | null {
  const snapshot = sim.getCurrentSnapshot();
  sampleTorque(match.tracker, match.prevJoints, snapshot.joints);
  match.prevJoints = { ...snapshot.joints };

  const seated = taskCompletion(snapshot.blocks, snapshot.graspedBlockId) >= 1;
  match.stackedHold = seated ? match.stackedHold + 1 : 0;
  const cap = match.mode === "vla" ? VLA_MATCH_MAX_TICKS : MATCH_MAX_TICKS;
  const overtime = snapshot.tick >= cap;
  const holding = snapshot.graspedBlockId !== null;
  const done =
    match.stackedHold >= 18 || (overtime && !holding) || snapshot.tick >= cap + MATCH_GRASP_GRACE_TICKS;
  if (done) {
    sim.setAgentCommand(null);
    const scores: MatchScores = scoreMatch(snapshot.blocks, match.tracker, snapshot.graspedBlockId);
    return {
      type: "result",
      match_id: match.matchId,
      status: "completed",
      scores: {
        spatial_accuracy: scores.spatial_accuracy,
        task_completion_score: scores.task_completion_score,
        joint_torque_telemetry: scores.joint_torque_telemetry,
      },
      elo_delta: 0,
    };
  }

  if (match.mode === "vla" && snapshot.tick % VLA_STRIDE !== 0) {
    return null;
  }

  const state = snapshotToState(snapshot, match.matchId, snapshot.tick, { mode: match.mode });
  const action = match.agent.act(state);
  match.lastPlan = match.agent.lastPlan;
  const joints = applyAgentAction(snapshot, action);
  sim.setAgentCommand({
    joints,
    gripperClosed: action.gripper_state === "closed",
  });
  return null;
}
