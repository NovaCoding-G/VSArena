import { describe, expect, it } from "vitest";
import { DEFAULT_JOINTS, TABLE_TOP_Y, CUBE_HALF } from "@/simulation/constants";
import { forwardKinematics } from "@/simulation/armKinematics";
import { snapshotToState } from "@/lib/harness/codec";
import { ColorSeek } from "@/lib/agents/colorSeek";
import { inverseKinematics } from "@/simulation/inverseKinematics";
import type { SimulationSnapshot } from "@/simulation/types";

function snapAt(tcp: [number, number, number], cube: [number, number, number]): SimulationSnapshot {
  const joints = inverseKinematics(tcp, 0);
  const arm = forwardKinematics(joints);
  return {
    joints,
    arm,
    blocks: [
      {
        id: "block_cyan",
        position: cube,
        rotation: [0, 0, 0, 1],
        color: "#00AEEF",
      },
    ],
    graspedBlockId: null,
    tick: 12,
    debugBoxes: [],
  };
}

describe("ColorSeek pick approach", () => {
  it("does not open-and-freeze when the TCP marker covers the cube", () => {
    const cube: [number, number, number] = [0.26, TABLE_TOP_Y + CUBE_HALF, -0.16];
    const hover: [number, number, number] = [0.18, TABLE_TOP_Y + CUBE_HALF + 0.12, -0.16];
    const agent = new ColorSeek();
    const seen = snapshotToState(snapAt(hover, cube), "m", 12, { mode: "vla" });
    expect(agent.act(seen).gripper_state).toBe("open");
    expect(agent.lastPlan).toMatch(/Seek cyan/);

    const covered = snapshotToState(snapAt(cube, cube), "m", 24, { mode: "vla" });
    let action = agent.act(covered);
    for (let i = 0; i < 5; i += 1) {
      action = agent.act(covered);
    }
    expect(agent.lastPlan).not.toMatch(/wait/);
    expect(agent.lastPlan).toMatch(/Down|Pinch|Lift/);
    expect(action.ee_delta ?? action.joint_targets).toBeTruthy();
  });

  it("emits a downward ee_delta once it is over the cube", () => {
    const cube: [number, number, number] = [0.26, TABLE_TOP_Y + CUBE_HALF, -0.16];
    const high: [number, number, number] = [0.26, TABLE_TOP_Y + CUBE_HALF + 0.14, -0.16];
    const agent = new ColorSeek();
    const state = snapshotToState(snapAt(high, cube), "m", 12, { mode: "vla" });
    let action = agent.act(state);
    for (let i = 0; i < 8; i += 1) {
      action = agent.act(state);
    }
    expect(agent.lastPlan).toMatch(/Down cyan/);
    expect(action.ee_delta?.dy).toBeLessThan(0);
    expect(action.gripper_state).toBe("open");
  });

  it("starts from DEFAULT pose with an open gripper toward cyan", () => {
    const arm = forwardKinematics(DEFAULT_JOINTS);
    const snapshot: SimulationSnapshot = {
      joints: DEFAULT_JOINTS,
      arm,
      blocks: [
        {
          id: "block_cyan",
          position: [0.26, TABLE_TOP_Y + CUBE_HALF, -0.16],
          rotation: [0, 0, 0, 1],
          color: "#00AEEF",
        },
      ],
      graspedBlockId: null,
      tick: 1,
      debugBoxes: [],
    };
    const action = new ColorSeek().act(snapshotToState(snapshot, "m", 1, { mode: "vla" }));
    expect(action.gripper_state).toBe("open");
    expect(action.ee_delta ?? action.joint_targets).toBeTruthy();
  });

  it("after lift, carries toward the stack pad not the pick blob", () => {
    const cube: [number, number, number] = [0.26, TABLE_TOP_Y + CUBE_HALF, -0.16];
    const over: [number, number, number] = [0.26, TABLE_TOP_Y + CUBE_HALF + 0.12, -0.16];
    const agent = new ColorSeek();
    const pick = snapshotToState(snapAt(over, cube), "m", 12, { mode: "vla" });
    let action = agent.act(pick);
    for (let i = 0; i < 80 && !agent.lastPlan.startsWith("Carry"); i += 1) {
      action = agent.act(pick);
    }
    expect(agent.lastPlan).toMatch(/Carry cyan/);
    expect(action.ee_delta?.dx).toBeGreaterThan(0);
    expect(action.ee_delta?.dz).toBeGreaterThan(0);
  });
});
