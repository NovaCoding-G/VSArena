import { describe, expect, it } from "vitest";
import { inverseKinematics } from "@/simulation/inverseKinematics";
import { forwardKinematics } from "@/simulation/armKinematics";
import { vecDist } from "@/simulation/math";
import { isActionMessage, isHelloMessage, snapshotToState, applyAgentAction } from "@/lib/harness/codec";
import { DEFAULT_JOINTS } from "@/simulation/constants";
import type { SimulationSnapshot } from "@/simulation/types";
import { BaselineIK } from "@/lib/agents/baselineIk";

describe("inverseKinematics", () => {
  it("returns a reachable TCP near a point in front of the mount", () => {
    const target: [number, number, number] = [0.32, 0.86, 0.05];
    const joints = inverseKinematics(target, 0);
    const fk = forwardKinematics(joints);
    expect(vecDist(fk.tcp.position, target)).toBeLessThan(0.22);
  });
});

describe("codec", () => {
  it("round-trips joint names into a state message", () => {
    const arm = forwardKinematics(DEFAULT_JOINTS);
    const snapshot: SimulationSnapshot = {
      joints: DEFAULT_JOINTS,
      arm,
      blocks: [],
      graspedBlockId: null,
      tick: 3,
      debugBoxes: [],
    };
    const state = snapshotToState(snapshot, "m1", 3);
    expect(state.type).toBe("state");
    expect(state.observation_mode).toBe("state");
    expect(state.instruction.length).toBeGreaterThan(0);
    expect(state.scene.joint_states.joint_1).toBe(DEFAULT_JOINTS.baseYaw);
    expect(state.scene.grasped_block_id).toBeNull();
  });

  it("guards action and hello messages", () => {
    expect(isHelloMessage({ type: "hello", api_key: "k" })).toBe(true);
    expect(isActionMessage({ type: "action", match_id: "m", tick: 1, action: { joint_targets: {}, gripper_state: "open" } })).toBe(true);
    expect(isActionMessage({ type: "state" })).toBe(false);
  });
});

describe("applyAgentAction", () => {
  it("moves TCP in +X when ee_delta.dx is positive", () => {
    const arm = forwardKinematics(DEFAULT_JOINTS);
    const snapshot: SimulationSnapshot = {
      joints: DEFAULT_JOINTS,
      arm,
      blocks: [],
      graspedBlockId: null,
      tick: 1,
      debugBoxes: [],
    };
    const next = applyAgentAction(snapshot, {
      gripper_state: "open",
      ee_delta: { dx: 0.04, dy: 0, dz: 0 },
    });
    const moved = forwardKinematics(next);
    expect(moved.tcp.position[0]).toBeGreaterThan(arm.tcp.position[0] + 0.01);
  });
});

describe("BaselineIK", () => {
  it("emits joint targets and a plan string", () => {
    const agent = new BaselineIK();
    const arm = forwardKinematics(DEFAULT_JOINTS);
    const snapshot: SimulationSnapshot = {
      joints: DEFAULT_JOINTS,
      arm,
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
    const state = snapshotToState(snapshot, "m", 1);
    const action = agent.act(state);
    expect(action.gripper_state).toBe("open");
    expect(action.joint_targets.joint_1).toBeTypeOf("number");
    expect(agent.lastPlan.length).toBeGreaterThan(0);
  });
});
