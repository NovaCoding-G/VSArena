"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ClipEngine } from "@/lib/clip/engine";
import { useClipStore } from "@/lib/clip/store";
import { useHudStore } from "@/lib/store";
import type { ClipOverlayState } from "@/lib/clip/overlay";

function readOverlay(): ClipOverlayState {
  const hud = useHudStore.getState();
  const clip = useClipStore.getState();
  return {
    phase: clip.phase === "endcard" ? "endcard" : "recording",
    elapsedMs: clip.startedAt ? performance.now() - clip.startedAt : 0,
    tick: hud.tick,
    agent: hud.matchStatus === "idle" && !hud.matchResult ? "TELEOP" : "Baseline-IK",
    grasped: Boolean(hud.graspedBlockId),
    matchStatus: hud.matchStatus,
    complete: hud.matchResult?.scores.task_completion_score ?? null,
    spatial: hud.matchResult?.scores.spatial_accuracy ?? null,
    eloDelta: hud.matchResult?.elo_delta ?? null,
  };
}

/**
 * Samples the live scene onto a dedicated 1080p renderer at 30 fps. Does not resize the dashboard canvas.
 *
 * @example <ClipRecorder />
 */
export function ClipRecorder() {
  const gl = useThree((state) => state.gl);
  const engineRef = useRef<ClipEngine | null>(null);
  const prevPhase = useRef(useClipStore.getState().phase);
  const matchWasRunning = useRef(false);

  useEffect(() => {
    const engine = new ClipEngine();
    engineRef.current = engine;
    void engine.preload();
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useFrame((state) => {
    const engine = engineRef.current;
    if (!engine) return;
    const clip = useClipStore.getState();
    const hud = useHudStore.getState();
    const phase = clip.phase;

    if (phase === "recording" && !engine.isActive) {
      engine.start(
        clip.format,
        gl,
        (blob) => useClipStore.getState().complete(blob, hud.matchResult ? "Baseline-IK" : "teleop"),
        (message) => useClipStore.getState().fail(message),
      );
    }

    if (phase === "endcard" && prevPhase.current === "recording") {
      engine.beginEndCard();
    }

    if (phase === "recording" && prevPhase.current !== "recording") {
      matchWasRunning.current = hud.matchStatus === "running";
    }
    if (hud.matchStatus === "running") matchWasRunning.current = true;
    if (phase === "recording" && matchWasRunning.current && hud.matchStatus === "completed") {
      matchWasRunning.current = false;
      useClipStore.getState().markEndCard();
      engine.beginEndCard();
    }

    if (phase === "recording" || phase === "endcard") {
      const signal = engine.tick(state.scene, state.camera, readOverlay());
      if (signal === "max") {
        useClipStore.getState().markEndCard();
        engine.beginEndCard();
      }
    }

    prevPhase.current = phase;
  });

  return null;
}
