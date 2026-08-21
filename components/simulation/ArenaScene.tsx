"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AUTO_RESET_DELAY_MS, DEFAULT_JOINTS } from "@/simulation/constants";
import { attachKeyboard, createInputBuffer } from "@/simulation/input";
import { ArenaSimulation } from "@/simulation/rapierWorld";
import { useHudStore } from "@/lib/store";
import { useDemoStore } from "@/lib/dataset/store";
import { createLocalMatch, stepLocalMatch, type LocalMatch } from "@/lib/harness/localMatch";
import { rasterScene, VLA_IMAGE_SIZE } from "@/lib/vision/raster";
import { ArenaSet } from "@/components/simulation/ArenaSet";
import { Blocks } from "@/components/simulation/Blocks";
import { ColliderDebug } from "@/components/simulation/ColliderDebug";
import { GridFloor } from "@/components/simulation/GridFloor";
import { RobotArm } from "@/components/simulation/RobotArm";
import { Table } from "@/components/simulation/Table";
import { TargetZone } from "@/components/simulation/TargetZone";
import type { BlockState, DebugBox, JointState, SimulationSnapshot } from "@/simulation/types";

/**
 * Owns the Rapier loop. R3F children only consume pose refs — they never step physics.
 */
export function ArenaScene() {
  const simRef = useRef<ArenaSimulation | null>(null);
  const inputRef = useRef(createInputBuffer());
  const hudTimer = useRef(0);
  const [bootstrapped, setBootstrapped] = useState(false);

  const jointsRef = useRef<JointState>({ ...DEFAULT_JOINTS });
  const blocksRef = useRef<BlockState[]>([]);
  const debugRef = useRef<DebugBox[]>([]);
  const matchRef = useRef<LocalMatch | null>(null);
  const lastPlanRef = useRef("");
  const lastAgentTick = useRef(-1);
  const autoResetAt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const stopKeyboard = attachKeyboard(inputRef.current);

    ArenaSimulation.create()
      .then((sim) => {
        if (cancelled) {
          sim.dispose();
          return;
        }
        simRef.current = sim;
        applySnapshot(sim.getInterpolatedSnapshot(0), jointsRef, blocksRef, debugRef);
        useHudStore.getState().setReady(true);
        setBootstrapped(true);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed to init Rapier WASM";
        useHudStore.getState().setError(message);
      });

    return () => {
      cancelled = true;
      stopKeyboard();
      simRef.current?.dispose();
      simRef.current = null;
      useHudStore.getState().setReady(false);
    };
  }, []);

  useFrame((_, delta) => {
    const sim = simRef.current;
    if (!sim) return;
    const alpha = sim.step(delta, inputRef.current);
    const snapshot = sim.getInterpolatedSnapshot(alpha);
    applySnapshot(snapshot, jointsRef, blocksRef, debugRef);

    const request = useHudStore.getState().matchRequest;
    const startedThisFrame = request === "start-baseline" || request === "start-colorseek" || request === "reset";
    if (request === "start-baseline" || request === "start-colorseek") {
      const mode = request === "start-colorseek" ? "vla" : "state";
      useHudStore.getState().consumeMatchRequest();
      autoResetAt.current = 0;
      sim.reset();
      sim.setAgentCommand(null);
      matchRef.current = createLocalMatch(mode);
      lastPlanRef.current = "";
      lastAgentTick.current = -1;
      useHudStore.getState().setMatchRunning(mode === "vla" ? "ColorSeek VLA match started" : "Baseline-IK match started");
      useHudStore.getState().pushLog(`Match ${matchRef.current.matchId.slice(0, 8)} ${mode}`);
    } else if (request === "abort") {
      useHudStore.getState().consumeMatchRequest();
      autoResetAt.current = 0;
      sim.setAgentCommand(null);
      matchRef.current = null;
      useHudStore.getState().finishMatch({
        type: "result",
        match_id: "aborted",
        status: "failed",
        scores: {
          spatial_accuracy: 0,
          task_completion_score: 0,
          joint_torque_telemetry: { peak: 0, avg: 0 },
        },
        elo_delta: 0,
      });
    } else if (request === "reset") {
      useHudStore.getState().consumeMatchRequest();
      resetTable(sim, matchRef, lastAgentTick, autoResetAt, true);
      applySnapshot(sim.getInterpolatedSnapshot(0), jointsRef, blocksRef, debugRef);
    }

    if (autoResetAt.current > 0 && performance.now() >= autoResetAt.current) {
      autoResetAt.current = 0;
      resetTable(sim, matchRef, lastAgentTick, autoResetAt, false);
      applySnapshot(sim.getInterpolatedSnapshot(0), jointsRef, blocksRef, debugRef);
    }

    if (matchRef.current && useHudStore.getState().matchStatus === "running") {
      const tick = sim.getCurrentSnapshot().tick;
      if (tick !== lastAgentTick.current) {
        lastAgentTick.current = tick;
        const result = stepLocalMatch(matchRef.current, sim);
        if (matchRef.current.lastPlan && matchRef.current.lastPlan !== lastPlanRef.current) {
          lastPlanRef.current = matchRef.current.lastPlan;
          useHudStore.getState().pushLog(matchRef.current.lastPlan);
        }
        if (result) {
          matchRef.current = null;
          sim.setAgentCommand(null);
          useHudStore.getState().finishMatch(result);
          autoResetAt.current = performance.now() + AUTO_RESET_DELAY_MS;
          // In-browser IK is unofficial: ELO only updates from the hosted harness ingest.
        }
      }
    }

    const events = sim.drainEvents();
    if (events.length > 0) {
      useHudStore.getState().ingestEvents(events);
    }
    if (
      !startedThisFrame &&
      matchRef.current &&
      events.some((event) => event.type === "reset") &&
      useHudStore.getState().matchStatus === "running"
    ) {
      autoResetAt.current = 0;
      sim.setAgentCommand(null);
      matchRef.current = null;
      useHudStore.getState().finishMatch({
        type: "result",
        match_id: "aborted",
        status: "failed",
        scores: {
          spatial_accuracy: 0,
          task_completion_score: 0,
          joint_torque_telemetry: { peak: 0, avg: 0 },
        },
        elo_delta: 0,
      });
    }

    const demo = useDemoStore.getState();
    if (demo.recording && demo.recorder) {
      if (demo.recorder.tick(delta, snapshot)) {
        useDemoStore.getState().bumpFrame(demo.recorder.frameCount);
      }
      if (demo.recorder.isFull) {
        useDemoStore.getState().stopAndDownload();
        useHudStore.getState().pushLog("Demo auto-stop at 60s / 300 frames");
      }
    }

    hudTimer.current += delta;
    if (hudTimer.current >= 0.1) {
      hudTimer.current = 0;
      useHudStore.getState().syncTelemetry({
        joints: snapshot.joints,
        tick: snapshot.tick,
        graspedBlockId: snapshot.graspedBlockId,
        tcp: snapshot.arm.tcp.position,
        vlaRgb: rasterScene(snapshot, VLA_IMAGE_SIZE),
        vlaSize: VLA_IMAGE_SIZE,
        blocks: snapshot.blocks.map((block) => ({
          id: block.id,
          position: block.position,
          color: block.color,
        })),
      });
    }
  });

  return (
    <>
      <ArenaSet />
      <Table />
      <GridFloor />
      <TargetZone />
      <RobotArm jointsRef={jointsRef} />
      {bootstrapped ? <Blocks blocksRef={blocksRef} /> : null}
      <ColliderDebug boxesRef={debugRef} />
    </>
  );
}

function applySnapshot(
  snapshot: SimulationSnapshot,
  jointsRef: MutableRefObject<JointState>,
  blocksRef: MutableRefObject<BlockState[]>,
  debugRef: MutableRefObject<DebugBox[]>,
): void {
  jointsRef.current = { ...snapshot.joints };
  blocksRef.current = snapshot.blocks;
  debugRef.current = snapshot.debugBoxes;
}

/**
 * Restore spawn poses. If a match is live and `abortIfRunning`, mark it failed.
 */
function resetTable(
  sim: ArenaSimulation,
  matchRef: MutableRefObject<LocalMatch | null>,
  lastAgentTick: MutableRefObject<number>,
  autoResetAt: MutableRefObject<number>,
  abortIfRunning: boolean,
): void {
  autoResetAt.current = 0;
  lastAgentTick.current = -1;
  sim.setAgentCommand(null);
  const hadMatch = matchRef.current !== null;
  matchRef.current = null;
  sim.reset();
  if (abortIfRunning && hadMatch && useHudStore.getState().matchStatus === "running") {
    useHudStore.getState().finishMatch({
      type: "result",
      match_id: "aborted",
      status: "failed",
      scores: {
        spatial_accuracy: 0,
        task_completion_score: 0,
        joint_torque_telemetry: { peak: 0, avg: 0 },
      },
      elo_delta: 0,
    });
  } else {
    useHudStore.getState().pushLog("Table reset");
  }
}
