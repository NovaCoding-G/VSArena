/** Read-only spectator fan-out. Assumption: judge stays on the agent socket; browsers only watch. */

import { taskCompletion } from "@/lib/scoring";
import type { ObservationMode } from "@/lib/harness/protocol";
import type { JointState, SimulationSnapshot, Vec3, Quat } from "@/simulation/types";

const BLOCK_ORDER = ["block_cyan", "block_orange", "block_magenta"] as const;

export interface SpectateBlock {
  id: string;
  position: Vec3;
  rotation: Quat;
  color: string;
}

export interface SpectateFrameMessage {
  type: "spectate_frame";
  match_id: string;
  tick: number;
  timestamp_ms: number;
  agent: string;
  mode: ObservationMode;
  joints: JointState;
  blocks: SpectateBlock[];
  grasped_block_id: string | null;
  task_completion_score: number;
}

export interface SpectateIdleMessage {
  type: "spectate_idle";
  busy: false;
}

export interface SpectateResultMessage {
  type: "spectate_result";
  match_id: string;
  agent: string;
  status: "completed" | "failed";
  scores: {
    spatial_accuracy: number;
    task_completion_score: number;
    joint_torque_telemetry: { peak: number; avg: number };
  };
  elo_delta: number;
}

export interface SpectateErrorMessage {
  type: "spectate_error";
  message: string;
}

export type SpectateMessage =
  | SpectateFrameMessage
  | SpectateIdleMessage
  | SpectateResultMessage
  | SpectateErrorMessage;

/**
 * Privileged snapshot → spectator wire frame (poses for Three.js, never agent actions).
 *
 * @example snapshotToSpectateFrame(snap, matchId, "ColorSeek", "vla")
 */
export function snapshotToSpectateFrame(
  snapshot: SimulationSnapshot,
  matchId: string,
  agent: string,
  mode: ObservationMode,
): SpectateFrameMessage {
  const byId = new Map(snapshot.blocks.map((b) => [b.id, b]));
  const blocks: SpectateBlock[] = BLOCK_ORDER.map((id) => {
    const block = byId.get(id);
    if (block) {
      return {
        id: block.id,
        position: block.position,
        rotation: block.rotation,
        color: block.color,
      };
    }
    return {
      id,
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      color: "#888888",
    };
  });

  return {
    type: "spectate_frame",
    match_id: matchId,
    tick: snapshot.tick,
    timestamp_ms: Date.now(),
    agent,
    mode,
    joints: { ...snapshot.joints },
    blocks,
    grasped_block_id: snapshot.graspedBlockId,
    task_completion_score: taskCompletion(snapshot.blocks, snapshot.graspedBlockId),
  };
}

export function isSpectatePath(urlPath: string): boolean {
  return urlPath === "/spectate" || urlPath === "/spectate/";
}
