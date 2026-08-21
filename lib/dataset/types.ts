/** Assumption: vsarena-demo-v1 is VLA-only (RGB + proprio, no cube poses). */

import type { GripperState, JointKey, VlaImage } from "@/lib/harness/protocol";

export const DEMO_FORMAT = "vsarena-demo-v1" as const;
export const DEMO_MAX_FRAMES = 300;
export const DEMO_HZ = 5;

export interface DemoAction {
  joint_targets: Record<JointKey, number>;
  ee_delta: { dx: number; dy: number; dz: number };
  gripper_state: GripperState;
}

export interface DemoFrame {
  t: number;
  tick: number;
  timestamp_ms: number;
  images: { scene: VlaImage };
  scene: {
    gripper_pose: [number, number, number, number, number, number, number];
    joint_states: Record<JointKey, number>;
  };
  action: DemoAction;
}

export interface DemoEpisode {
  format: typeof DEMO_FORMAT;
  task: "block_stacking";
  observation_mode: "vla";
  instruction: string;
  hz: number;
  created_at: string;
  frames: DemoFrame[];
}
