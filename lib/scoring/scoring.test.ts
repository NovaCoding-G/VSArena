import { describe, expect, it } from "vitest";
import {
  createTorqueTracker,
  orientationScore,
  positionScore,
  sampleTorque,
  scoreMatch,
  spatialAccuracy,
  summarizeTorque,
  taskCompletion,
} from "@/lib/scoring";
import { BLOCK_TARGETS, TABLE_TOP_Y, CUBE_HALF } from "@/simulation/constants";
import type { BlockState } from "@/simulation/types";

function block(id: string, position: [number, number, number], rotation: [number, number, number, number] = [0, 0, 0, 1]): BlockState {
  return { id, position, rotation, color: "#fff" };
}

describe("positionScore", () => {
  it("is 1 at the target and 0 far away", () => {
    expect(positionScore([0, 0, 0], [0, 0, 0])).toBe(1);
    expect(positionScore([10, 0, 0], [0, 0, 0])).toBe(0);
  });
});

describe("orientationScore", () => {
  it("scores identity as upright", () => {
    expect(orientationScore([0, 0, 0, 1])).toBeCloseTo(1, 5);
  });
});

describe("taskCompletion", () => {
  it("is 1 when every block sits in its 3D stack slot", () => {
    const blocks = Object.entries(BLOCK_TARGETS).map(([id, position]) => block(id, position));
    expect(taskCompletion(blocks)).toBe(1);
  });

  it("gives partial credit off-target", () => {
    const blocks = [
      block("block_cyan", [0.26, TABLE_TOP_Y + CUBE_HALF, -0.16]),
      block("block_orange", BLOCK_TARGETS.block_orange),
      block("block_magenta", BLOCK_TARGETS.block_magenta),
    ];
    const score = taskCompletion(blocks);
    expect(score).toBeGreaterThan(0.3);
    expect(score).toBeLessThan(1);
  });

  it("does not count a flat dump on the pad as a stacked tower", () => {
    const base = BLOCK_TARGETS.block_cyan;
    const dumped = [
      block("block_cyan", base),
      block("block_orange", base),
      block("block_magenta", [base[0] + 0.04, base[1], base[2]]),
    ];
    expect(taskCompletion(dumped)).toBeLessThan(1);
    expect(taskCompletion(dumped)).toBeGreaterThan(0.2);
  });

  it("does not complete while the top cube is still grasped", () => {
    const stacked = Object.entries(BLOCK_TARGETS).map(([id, position]) => block(id, position));
    expect(taskCompletion(stacked, "block_magenta")).toBeLessThan(1);
    expect(taskCompletion(stacked, null)).toBe(1);
  });
});

describe("spatialAccuracy", () => {
  it("is high when poses match targets", () => {
    const blocks = Object.entries(BLOCK_TARGETS).map(([id, position]) => block(id, position));
    expect(spatialAccuracy(blocks)).toBeGreaterThan(0.95);
  });
});

describe("torque tracker", () => {
  it("records peak and average effort", () => {
    const tracker = createTorqueTracker();
    const rest = { baseYaw: 0, shoulderPitch: 0, elbowPitch: 0, wristPitch: 0, gripper: 0 };
    sampleTorque(tracker, rest, rest);
    sampleTorque(tracker, rest, { ...rest, baseYaw: 0.5 });
    const summary = summarizeTorque(tracker);
    expect(summary.peak).toBeGreaterThan(summary.avg);
    expect(summary.avg).toBeGreaterThan(0);
  });
});

describe("scoreMatch", () => {
  it("composes the public score payload", () => {
    const tracker = createTorqueTracker();
    const blocks = Object.entries(BLOCK_TARGETS).map(([id, position]) => block(id, position));
    const scores = scoreMatch(blocks, tracker);
    expect(scores.task_completion_score).toBe(1);
    expect(scores.spatial_accuracy).toBeGreaterThan(0.9);
    expect(scores.joint_torque_telemetry).toEqual({ peak: 0, avg: 0 });
  });
});
