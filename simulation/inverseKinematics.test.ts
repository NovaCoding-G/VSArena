import { describe, expect, it } from "vitest";
import { forwardKinematics } from "@/simulation/armKinematics";
import { inverseKinematics } from "@/simulation/inverseKinematics";
import { BLOCK_SPAWNS } from "@/simulation/constants";

function dist(a: number[], b: number[]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

describe("inverseKinematics", () => {
  it("reaches in-workspace Cartesian goals within 2 cm", () => {
    const goals: Array<[number, number, number]> = [
      [0.3, 0.82, 0.1],
      [0.22, 0.78, -0.12],
      [0.4, 0.88, 0],
    ];
    for (const goal of goals) {
      const ik = inverseKinematics(goal, 0);
      const tcp = forwardKinematics(ik).tcp.position;
      expect(dist(tcp, goal), `goal ${goal}`).toBeLessThan(0.02);
    }
  });

  it("reaches pick and hover poses for spawned blocks", () => {
    for (const spawn of BLOCK_SPAWNS) {
      const hover: [number, number, number] = [spawn.position[0], spawn.position[1] + 0.14, spawn.position[2]];
      const pick: [number, number, number] = [spawn.position[0], spawn.position[1], spawn.position[2]];
      for (const goal of [hover, pick]) {
        const tcp = forwardKinematics(inverseKinematics(goal, 0)).tcp.position;
        expect(dist(tcp, goal), `${spawn.id} ${goal}`).toBeLessThan(0.03);
      }
    }
  });
});
