/** Shared simulation types. Physics owns these; React only reads snapshots. */

export interface JointState {
  baseYaw: number;
  shoulderPitch: number;
  elbowPitch: number;
  wristPitch: number;
  gripper: number;
}

export type Vec3 = [number, number, number];
/** Quaternion stored as xyzw (Rapier / Three.js). */
export type Quat = [number, number, number, number];

export interface Pose {
  position: Vec3;
  rotation: Quat;
}

export interface ArmSnapshot {
  pedestal: Pose;
  shoulder: Pose;
  upperArm: Pose;
  elbow: Pose;
  forearm: Pose;
  wrist: Pose;
  palm: Pose;
  jawLeft: Pose;
  jawRight: Pose;
  tcp: Pose;
}

export interface BlockState {
  id: string;
  position: Vec3;
  rotation: Quat;
  color: string;
}

export interface DebugBox {
  id: string;
  position: Vec3;
  rotation: Quat;
  halfExtents: Vec3;
  color: string;
}

export interface SimulationSnapshot {
  joints: JointState;
  arm: ArmSnapshot;
  blocks: BlockState[];
  graspedBlockId: string | null;
  tick: number;
  debugBoxes: DebugBox[];
}

export interface InputBuffer {
  held: Record<string, boolean>;
  gripperToggleQueued: boolean;
  resetQueued: boolean;
}

/** Absolute joint servo command from an agent (harness decoded). */
export interface AgentCommand {
  joints: JointState;
  gripperClosed: boolean;
}

export type SimEvent =
  | { type: "grasp"; blockId: string }
  | { type: "release"; blockId: string }
  | { type: "reset" }
  | { type: "panic"; message: string };
