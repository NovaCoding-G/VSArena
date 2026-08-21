"use client";

import { Grid } from "@react-three/drei";
import { useHudStore } from "@/lib/store";

/** Optional occupancy grid. Kept small so it does not erase the arena shell. */
export function GridFloor() {
  const visible = useHudStore((s) => s.showGrid);
  if (!visible) return null;

  return (
    <Grid
      position={[0, 0.004, 0]}
      args={[4, 4]}
      cellSize={0.1}
      cellThickness={0.35}
      cellColor="#1a222c"
      sectionSize={0.5}
      sectionThickness={0.55}
      sectionColor="#2a3542"
      fadeDistance={2.8}
      fadeStrength={1.8}
      infiniteGrid={false}
    />
  );
}
