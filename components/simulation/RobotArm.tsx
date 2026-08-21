"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import {
  ARM_MOUNT,
  GRASP_DEPTH,
  JAW_HEIGHT,
  JAW_LENGTH,
  JAW_MAX_SEP,
  JAW_MIN_SEP,
  JAW_THICKNESS,
  L_FOREARM,
  L_UPPER,
  L_WRIST,
  LINK_SIZE,
  PEDESTAL_H,
  PEDESTAL_R,
} from "@/simulation/constants";
import type { JointState } from "@/simulation/types";

const ACCENT = "#e06a1a";
const METAL = "#c5ced8";
const DARK = "#2c3440";
const GRAPHITE = "#4a5564";
const PAD = "#1a1e24";

interface RobotArmProps {
  jointsRef: MutableRefObject<JointState>;
}

/**
 * Nested kinematic visual driven by joint angles (same chain as FK).
 */
export function RobotArm({ jointsRef }: RobotArmProps) {
  const yaw = useRef<Group>(null);
  const shoulder = useRef<Group>(null);
  const elbow = useRef<Group>(null);
  const wrist = useRef<Group>(null);
  const jawLeft = useRef<Group>(null);
  const jawRight = useRef<Group>(null);

  const accentMat = useMemo(() => ({ color: ACCENT, metalness: 0.42, roughness: 0.38 }), []);
  const metalMat = useMemo(() => ({ color: METAL, metalness: 0.88, roughness: 0.22 }), []);
  const darkMat = useMemo(() => ({ color: DARK, metalness: 0.7, roughness: 0.4 }), []);
  const graphiteMat = useMemo(() => ({ color: GRAPHITE, metalness: 0.58, roughness: 0.36 }), []);
  const jawMat = useMemo(() => ({ color: "#c5ced8", metalness: 0.55, roughness: 0.28 }), []);
  const padMat = useMemo(() => ({ color: PAD, metalness: 0.12, roughness: 0.72 }), []);

  useFrame(() => {
    const j = jointsRef.current;
    if (yaw.current) yaw.current.rotation.y = j.baseYaw;
    if (shoulder.current) shoulder.current.rotation.z = j.shoulderPitch;
    if (elbow.current) elbow.current.rotation.z = j.elbowPitch;
    if (wrist.current) wrist.current.rotation.z = j.wristPitch;
    const sep = JAW_MIN_SEP / 2 + ((JAW_MAX_SEP - JAW_MIN_SEP) / 2) * (1 - j.gripper);
    if (jawLeft.current) jawLeft.current.position.set(JAW_LENGTH / 2, 0, sep);
    if (jawRight.current) jawRight.current.position.set(JAW_LENGTH / 2, 0, -sep);
  });

  return (
    <group position={ARM_MOUNT}>
      <mesh position={[0, PEDESTAL_H / 2, 0]} castShadow>
        <cylinderGeometry args={[PEDESTAL_R, PEDESTAL_R + 0.016, PEDESTAL_H, 28]} />
        <meshStandardMaterial {...darkMat} />
      </mesh>
      <mesh position={[0, PEDESTAL_H - 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.022, 24]} />
        <meshStandardMaterial {...metalMat} />
      </mesh>

      <group ref={yaw} position={[0, PEDESTAL_H, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.046, 0.046, 0.08, 22]} />
          <meshStandardMaterial {...metalMat} />
        </mesh>
        <group ref={shoulder}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.078, 18]} />
            <meshStandardMaterial {...darkMat} />
          </mesh>
          <mesh position={[L_UPPER / 2, 0, 0]} castShadow>
            <boxGeometry args={[L_UPPER, LINK_SIZE, LINK_SIZE]} />
            <meshStandardMaterial {...accentMat} />
          </mesh>
          <mesh position={[L_UPPER, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.034, 0.034, 0.07, 16]} />
            <meshStandardMaterial {...metalMat} />
          </mesh>

          <group ref={elbow} position={[L_UPPER, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.036, 0.036, 0.074, 18]} />
              <meshStandardMaterial {...metalMat} />
            </mesh>
            <mesh position={[L_FOREARM / 2, 0, 0]} castShadow>
              <boxGeometry args={[L_FOREARM, LINK_SIZE - 0.006, LINK_SIZE - 0.006]} />
              <meshStandardMaterial {...graphiteMat} />
            </mesh>

            <group ref={wrist} position={[L_FOREARM, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.03, 0.06, 16]} />
                <meshStandardMaterial {...metalMat} />
              </mesh>
              <mesh position={[L_WRIST / 2, 0, 0]} castShadow>
                <boxGeometry args={[L_WRIST, LINK_SIZE - 0.014, LINK_SIZE - 0.014]} />
                <meshStandardMaterial {...darkMat} />
              </mesh>
              <mesh position={[L_WRIST, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.026, 0.026, 0.052, 14]} />
                <meshStandardMaterial {...metalMat} />
              </mesh>
              <group position={[L_WRIST, 0, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[0.046, 0.05, 0.082]} />
                  <meshStandardMaterial {...graphiteMat} />
                </mesh>
                <mesh position={[0.02, 0, 0]} castShadow>
                  <boxGeometry args={[0.018, 0.038, 0.074]} />
                  <meshStandardMaterial {...darkMat} />
                </mesh>
                <mesh position={[GRASP_DEPTH, 0, 0]}>
                  <sphereGeometry args={[0.012, 12, 12]} />
                  <meshBasicMaterial color="#00AEEF" transparent opacity={0.85} />
                </mesh>
                <Jaw groupRef={jawLeft} innerSign={-1} jawMat={jawMat} padMat={padMat} />
                <Jaw groupRef={jawRight} innerSign={1} jawMat={jawMat} padMat={padMat} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function Jaw({
  groupRef,
  innerSign,
  jawMat,
  padMat,
}: {
  groupRef: MutableRefObject<Group | null>;
  innerSign: number;
  jawMat: { color: string; metalness: number; roughness: number };
  padMat: { color: string; metalness: number; roughness: number };
}) {
  const padT = 0.004;
  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow={false}>
        <boxGeometry args={[JAW_LENGTH, JAW_HEIGHT, JAW_THICKNESS]} />
        <meshStandardMaterial {...jawMat} />
      </mesh>
      <mesh
        position={[0.008, 0, innerSign * (JAW_THICKNESS / 2 + padT / 2 + 0.0008)]}
        receiveShadow={false}
        castShadow={false}
      >
        <boxGeometry args={[JAW_LENGTH * 0.64, JAW_HEIGHT * 0.8, padT]} />
        <meshStandardMaterial {...padMat} />
      </mesh>
    </group>
  );
}
