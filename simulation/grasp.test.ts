import { describe, expect, it } from "vitest";
import { quatIdentity } from "@/simulation/math";
import { inGraspVolume, findGraspTarget } from "@/simulation/grasp";
import { GRASP_DEPTH, CUBE_SIZE, JAW_MIN_SEP, JAW_THICKNESS } from "@/simulation/constants";
import { forwardKinematics } from "@/simulation/armKinematics";
import { DEFAULT_JOINTS } from "@/simulation/constants";
import { vecDist } from "@/simulation/math";

describe("inGraspVolume", () => {
  it("accepts a block at the TCP and rejects one beside the fingers", () => {
    const tcp: [number, number, number] = [0.3, 0.75, 0];
    const rot = quatIdentity();
    expect(inGraspVolume(tcp, rot, [0.3, 0.75, 0])).toBe(true);
    expect(inGraspVolume(tcp, rot, [0.3, 0.75, 0.12])).toBe(false);
  });
});

describe("findGraspTarget", () => {
  it("picks the nearer in-volume cube", () => {
    const tcp: [number, number, number] = [0.3, 0.75, 0];
    const rot = quatIdentity();
    const id = findGraspTarget(tcp, rot, [
      { id: "far", position: [0.5, 0.75, 0] },
      { id: "near", position: [0.31, 0.75, 0.01] },
    ]);
    expect(id).toBe("near");
  });
});

describe("forwardKinematics TCP", () => {
  it("places TCP grasp_depth in front of the palm", () => {
    const arm = forwardKinematics(DEFAULT_JOINTS);
    expect(vecDist(arm.tcp.position, arm.palm.position)).toBeCloseTo(GRASP_DEPTH, 3);
  });
});

describe("jaw closed gap", () => {
  it("matches the cube so pads touch faces instead of clipping through", () => {
    const closedSep = JAW_MIN_SEP / 2;
    const innerGap = 2 * (closedSep - JAW_THICKNESS / 2);
    expect(innerGap).toBeCloseTo(CUBE_SIZE, 3);
  });
});
