/** Official-match replay artifact (privileged poses, no RGB). Format vsarena-replay-v1. */

import { REPLAY_FORMAT } from "@/lib/eval/product";
import type { EvalProvenance } from "@/lib/eval/provenance";
import type { FailureRecord } from "@/lib/eval/taxonomy";
import type { ResultMessage } from "@/lib/harness/protocol";
import type { JointState, SimulationSnapshot } from "@/simulation/types";

export interface ReplaySample {
  tick: number;
  joints: JointState;
  blocks: Array<{
    id: string;
    position: [number, number, number];
    rotation: [number, number, number, number];
  }>;
  grasped_block_id: string | null;
}

export interface ReplayArtifact {
  format: typeof REPLAY_FORMAT;
  match_id: string;
  agent: string;
  provenance: EvalProvenance;
  failure: FailureRecord;
  scores: ResultMessage["scores"];
  status: ResultMessage["status"];
  samples: ReplaySample[];
}

const MAX_SAMPLES = 48;

/**
 * Keep a sparse privileged trail for post-match audit.
 *
 * @example maybeRecordReplaySample(samples, snap, "vla")
 */
export function maybeRecordReplaySample(
  samples: ReplaySample[],
  snapshot: SimulationSnapshot,
  mode: "vla" | "state",
): void {
  if (samples.length >= MAX_SAMPLES) return;
  const every = mode === "vla" ? 8 : 40;
  if (snapshot.tick !== 0 && snapshot.tick % every !== 0 && samples.length > 0) return;
  samples.push(snapshotToReplaySample(snapshot));
}

export function snapshotToReplaySample(snapshot: SimulationSnapshot): ReplaySample {
  return {
    tick: snapshot.tick,
    joints: { ...snapshot.joints },
    blocks: snapshot.blocks.map((b) => ({
      id: b.id,
      position: [...b.position] as [number, number, number],
      rotation: [...b.rotation] as [number, number, number, number],
    })),
    grasped_block_id: snapshot.graspedBlockId,
  };
}

export function buildReplayArtifact(input: {
  matchId: string;
  agent: string;
  provenance: EvalProvenance;
  failure: FailureRecord;
  scores: ResultMessage["scores"];
  status: ResultMessage["status"];
  samples: ReplaySample[];
}): ReplayArtifact {
  return {
    format: REPLAY_FORMAT,
    match_id: input.matchId,
    agent: input.agent,
    provenance: input.provenance,
    failure: input.failure,
    scores: input.scores,
    status: input.status,
    samples: input.samples,
  };
}
