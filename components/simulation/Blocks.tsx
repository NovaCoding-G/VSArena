"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { CUBE_SIZE } from "@/simulation/constants";
import type { BlockState } from "@/simulation/types";

interface BlocksProps {
  blocksRef: MutableRefObject<BlockState[]>;
}

/** Colored dynamic cubes. Transforms are applied from physics snapshots via refs. */
export function Blocks({ blocksRef }: BlocksProps) {
  const cyan = useRef<Mesh>(null);
  const orange = useRef<Mesh>(null);
  const magenta = useRef<Mesh>(null);

  useFrame(() => {
    const meshes = [cyan.current, orange.current, magenta.current];
    for (let i = 0; i < meshes.length; i += 1) {
      const mesh = meshes[i];
      const block = blocksRef.current[i];
      if (!mesh || !block) continue;
      mesh.position.set(block.position[0], block.position[1], block.position[2]);
      mesh.quaternion.set(block.rotation[0], block.rotation[1], block.rotation[2], block.rotation[3]);
    }
  });

  return (
    <group>
      <mesh ref={cyan} castShadow receiveShadow>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial color="#00AEEF" metalness={0.12} roughness={0.38} />
      </mesh>
      <mesh ref={orange} castShadow receiveShadow>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial color="#F7941E" metalness={0.12} roughness={0.38} />
      </mesh>
      <mesh ref={magenta} castShadow receiveShadow>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial color="#E11D8F" metalness={0.12} roughness={0.38} />
      </mesh>
    </group>
  );
}
