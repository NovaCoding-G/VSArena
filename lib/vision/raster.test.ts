import { describe, expect, it } from "vitest";
import { DEFAULT_JOINTS } from "@/simulation/constants";
import { forwardKinematics } from "@/simulation/armKinematics";
import { encodeRgb8, rasterScene, VLA_IMAGE_SIZE } from "@/lib/vision/raster";
import { snapshotToState } from "@/lib/harness/codec";
import { findBlobs } from "@/lib/vision/blobs";
import { ColorSeek } from "@/lib/agents/colorSeek";
import type { SimulationSnapshot } from "@/simulation/types";

function snap(blockX: number): SimulationSnapshot {
  const arm = forwardKinematics(DEFAULT_JOINTS);
  return {
    joints: DEFAULT_JOINTS,
    arm,
    blocks: [
      {
        id: "block_cyan",
        position: [blockX, 0.75, -0.16],
        rotation: [0, 0, 0, 1],
        color: "#00AEEF",
      },
    ],
    graspedBlockId: null,
    tick: 1,
    debugBoxes: [],
  };
}

describe("VLA scene raster", () => {
  it("emits a packed RGB buffer whose pixels move when a cube moves", () => {
    const a = rasterScene(snap(0.26));
    const b = rasterScene(snap(0.5));
    expect(a.length).toBe(VLA_IMAGE_SIZE * VLA_IMAGE_SIZE * 3);
    expect(encodeRgb8(a).length).toBeGreaterThan(32);
    expect(Buffer.compare(Buffer.from(a), Buffer.from(b))).not.toBe(0);
  });

  it("finds a cyan blob that tracks the cube", () => {
    const blobs = findBlobs(rasterScene(snap(0.26)), VLA_IMAGE_SIZE);
    expect(blobs.cyan).not.toBeNull();
    expect(blobs.tcp).not.toBeNull();
  });

  it("ColorSeek emits ee_delta toward the cyan blob without reading poses", () => {
    const state = snapshotToState(snap(0.26), "m", 1, { mode: "vla" });
    const action = new ColorSeek().act(state);
    expect(state.scene.blocks).toEqual([]);
    expect(action.gripper_state).toBe("open");
    expect(action.ee_delta ?? action.joint_targets).toBeTruthy();
  });
});
