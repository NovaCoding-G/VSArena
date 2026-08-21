"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useHudStore } from "@/lib/store";
import type { DebugBox } from "@/simulation/types";

interface ColliderDebugProps {
  boxesRef: MutableRefObject<DebugBox[]>;
}

/** Wireframe Rapier colliders. Toggled from the HUD; never drives physics. */
export function ColliderDebug({ boxesRef }: ColliderDebugProps) {
  const visible = useHudStore((s) => s.showColliders);
  const groups = useRef<Array<Group | null>>([]);

  useFrame(() => {
    if (!visible) return;
    const boxes = boxesRef.current;
    for (let i = 0; i < groups.current.length; i += 1) {
      const group = groups.current[i];
      const box = boxes[i];
      if (!group || !box) continue;
      group.position.set(box.position[0], box.position[1], box.position[2]);
      group.quaternion.set(box.rotation[0], box.rotation[1], box.rotation[2], box.rotation[3]);
      group.scale.set(box.halfExtents[0] * 2, box.halfExtents[1] * 2, box.halfExtents[2] * 2);
    }
  });

  if (!visible) return null;

  return (
    <group>
      {boxesRef.current.map((box, i) => (
        <group
          key={box.id}
          ref={(node) => {
            groups.current[i] = node;
          }}
        >
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={box.color} wireframe transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
