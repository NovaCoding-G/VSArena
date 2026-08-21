import { describe, expect, it } from "vitest";
import { DEFAULT_JOINTS } from "@/simulation/constants";
import { forwardKinematics } from "@/simulation/armKinematics";
import { captureDemoFrame, DemoRecorder, serializeDemo } from "@/lib/dataset/recorder";
import { DEMO_FORMAT } from "@/lib/dataset/types";
import type { SimulationSnapshot } from "@/simulation/types";

function snap(x: number, gripper = 0): SimulationSnapshot {
  const joints = { ...DEFAULT_JOINTS, gripper };
  const arm = forwardKinematics(joints);
  arm.tcp.position = [x, 1.0, 0.05];
  return {
    joints,
    arm,
    blocks: [
      {
        id: "block_cyan",
        position: [0.2, 0.75, -0.16],
        rotation: [0, 0, 0, 1],
        color: "#00AEEF",
      },
    ],
    graspedBlockId: null,
    tick: 4,
    debugBoxes: [],
  };
}

describe("VLA demo recorder", () => {
  it("hides cube poses and records zero delta on the first frame", () => {
    const frame = captureDemoFrame(snap(0.1), null, 0);
    expect(frame.action.ee_delta).toEqual({ dx: 0, dy: 0, dz: 0 });
    expect(frame.action.gripper_state).toBe("open");
    expect(frame.images.scene.width).toBe(128);
    expect("blocks" in frame.scene).toBe(false);
  });

  it("stores TCP motion as ee_delta between samples", () => {
    const a = snap(0.1);
    const b = snap(0.16, 1);
    const frame = captureDemoFrame(b, a.arm.tcp.position, 1);
    expect(frame.action.ee_delta.dx).toBeCloseTo(0.06);
    expect(frame.action.gripper_state).toBe("closed");
    expect(frame.action.joint_targets.joint_1).toBe(DEFAULT_JOINTS.baseYaw);
  });

  it("samples at 5 Hz and serializes vsarena-demo-v1", () => {
    const rec = new DemoRecorder();
    rec.start();
    expect(rec.tick(0.1, snap(0))).toBe(false);
    expect(rec.tick(0.1, snap(0.2))).toBe(true);
    expect(rec.frameCount).toBe(1);
    const episode = rec.stop();
    expect(episode.format).toBe(DEMO_FORMAT);
    expect(episode.observation_mode).toBe("vla");
    expect(episode.hz).toBe(5);
    const parsed = JSON.parse(serializeDemo(episode)) as { frames: unknown[] };
    expect(parsed.frames).toHaveLength(1);
  });
});
