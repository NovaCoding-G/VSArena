import { describe, expect, it } from "vitest";
import { NEGATIVE_ACTION_FIXTURES, parseActionContract } from "@/lib/eval/actionSchema";
import { DEFAULT_JOINTS } from "@/simulation/constants";
import { snapshotToState } from "@/lib/harness/codec";
import { parseStateContract } from "@/lib/eval/observationSchema";
import { forwardKinematics } from "@/simulation/armKinematics";
import type { SimulationSnapshot } from "@/simulation/types";

const valid = {
  gripper_state: "open" as const,
  joint_targets: { joint_1: 0.1, joint_2: 0.2, joint_3: -1, joint_4: 0 },
};

function snap(): SimulationSnapshot {
  return {
    joints: DEFAULT_JOINTS,
    arm: forwardKinematics(DEFAULT_JOINTS),
    blocks: [
      {
        id: "block_cyan",
        position: [0.26, 0.75, -0.16],
        rotation: [0, 0, 0, 1],
        color: "#00AEEF",
      },
    ],
    graspedBlockId: null,
    tick: 1,
    debugBoxes: [],
  };
}

describe("action contract", () => {
  it("accepts a finite joint hold", () => {
    const parsed = parseActionContract(valid);
    expect(parsed.ok).toBe(true);
  });

  it("rejects every negative-control fixture", () => {
    for (const fixture of NEGATIVE_ACTION_FIXTURES) {
      const parsed = parseActionContract(fixture.action);
      expect(parsed.ok, fixture.name).toBe(false);
    }
  });
});

describe("observation contract", () => {
  it("hides cubes on the VLA track and keeps them on state", () => {
    const vla = snapshotToState(snap(), "m", 1, { mode: "vla" });
    const state = snapshotToState(snap(), "m", 1, { mode: "state" });
    expect(parseStateContract(vla)).toEqual({ ok: true, mode: "vla" });
    expect(parseStateContract(state)).toEqual({ ok: true, mode: "state" });
    expect(vla.scene.blocks).toEqual([]);
    expect(state.scene.blocks.length).toBe(1);
  });

  it("rejects a VLA frame that leaks poses", () => {
    const leaked = snapshotToState(snap(), "m", 1, { mode: "vla" });
    leaked.scene.blocks = snapshotToState(snap(), "m", 1, { mode: "state" }).scene.blocks;
    expect(parseStateContract(leaked).ok).toBe(false);
  });
});
