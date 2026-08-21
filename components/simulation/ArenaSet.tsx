"use client";

// Assumption: studio cyclorama is the MVP visual. Post-MVP v1.1 Colosseum remains visual-only — no physics change.

import { useMemo } from "react";
import { BackSide } from "three";
import { TABLE_HALF_EXTENTS, TABLE_TOP_Y } from "@/simulation/constants";

/**
 * Quiet photography studio around the work-cell. Visual only; Rapier owns the table.
 *
 * @example <ArenaSet />
 */
export function ArenaSet() {
  const cove = useMemo(
    () => ({ color: "#1a1f28", metalness: 0, roughness: 1, side: BackSide }),
    [],
  );
  const floor = useMemo(() => ({ color: "#1c222c", metalness: 0.08, roughness: 0.82 }), []);
  const apron = useMemo(() => ({ color: "#2a313c", metalness: 0.12, roughness: 0.64 }), []);
  const steel = useMemo(() => ({ color: "#4a5564", metalness: 0.55, roughness: 0.35 }), []);

  const fx = TABLE_HALF_EXTENTS.x + 0.04;
  const fz = TABLE_HALF_EXTENTS.z + 0.04;
  const railY = TABLE_TOP_Y + 0.26;

  return (
    <group>
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[6.2, 6.2, 3.1, 64, 1, true]} />
        <meshStandardMaterial {...cove} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[6.2, 72]} />
        <meshStandardMaterial {...floor} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <circleGeometry args={[1.72, 64]} />
        <meshStandardMaterial {...apron} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[1.7, 1.712, 96]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.22} />
      </mesh>

      <mesh position={[0, 2.92, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.8, 1.8]} />
        <meshBasicMaterial color="#eef2f6" transparent opacity={0.07} depthWrite={false} />
      </mesh>

      <Post x={fx} z={fz} y={railY} steel={steel} />
      <Post x={-fx} z={fz} y={railY} steel={steel} />
      <Post x={fx} z={-fz} y={railY} steel={steel} />
      <Post x={-fx} z={-fz} y={railY} steel={steel} />
      <mesh position={[0, railY, fz]}>
        <boxGeometry args={[fx * 2, 0.012, 0.012]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[0, railY, -fz]}>
        <boxGeometry args={[fx * 2, 0.012, 0.012]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[fx, railY, 0]}>
        <boxGeometry args={[0.012, 0.012, fz * 2]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[-fx, railY, 0]}>
        <boxGeometry args={[0.012, 0.012, fz * 2]} />
        <meshStandardMaterial {...steel} />
      </mesh>
    </group>
  );
}

function Post({
  x,
  z,
  y,
  steel,
}: {
  x: number;
  z: number;
  y: number;
  steel: { color: string; metalness: number; roughness: number };
}) {
  return (
    <mesh position={[x, y / 2, z]} castShadow>
      <boxGeometry args={[0.018, y, 0.018]} />
      <meshStandardMaterial {...steel} />
    </mesh>
  );
}
