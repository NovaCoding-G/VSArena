import { describe, expect, it } from "vitest";
import { ArenaSimulation } from "@/simulation/rapierWorld";
import { createInputBuffer } from "@/simulation/input";
import { createLocalMatch, stepLocalMatch } from "@/lib/harness/localMatch";
import { BLOCK_SPAWNS, FIXED_DT, STACK_ORIGIN, TABLE_TOP_Y } from "@/simulation/constants";
import { vecDist } from "@/simulation/math";

describe("BaselineIK in the physics loop", () => {
  it("moves TCP toward the first block and leaves hover_pick", async () => {
    const sim = await ArenaSimulation.create();
    const input = createInputBuffer();
    const match = createLocalMatch();
    const startTcp = sim.getCurrentSnapshot().arm.tcp.position;
    const block = BLOCK_SPAWNS[0].position;
    const hover: [number, number, number] = [block[0], block[1] + 0.13, block[2]];

    let leftHover = false;
    for (let i = 0; i < 180; i += 1) {
      sim.step(FIXED_DT, input);
      const result = stepLocalMatch(match, sim);
      expect(result).toBeNull();
      if (match.agent.lastPlan.startsWith("Descend") || match.agent.lastPlan.startsWith("Pinch") || match.agent.lastPlan.startsWith("Lift")) {
        leftHover = true;
        break;
      }
    }

    const tcp = sim.getCurrentSnapshot().arm.tcp.position;
    const toward = vecDist(startTcp, hover) - vecDist(tcp, hover);
    sim.dispose();

    expect(toward, `TCP should approach hover (start ${startTcp} now ${tcp})`).toBeGreaterThan(0.04);
    expect(leftHover, `still in: ${match.agent.lastPlan}`).toBe(true);
  }, 20000);

  it("lifts the grasped cube with the TCP instead of plowing neighbors", async () => {
    const sim = await ArenaSimulation.create();
    const input = createInputBuffer();
    const match = createLocalMatch();
    const cyanSpawn = BLOCK_SPAWNS[0].position;
    const orangeSpawn = BLOCK_SPAWNS[1].position;
    let maxCyanY = cyanSpawn[1];
    let graspedCyan = false;
    let minHeldGap = 99;
    let orangeShiftDuringCyan = 0;

    for (let i = 0; i < 700; i += 1) {
      sim.step(FIXED_DT, input);
      const result = stepLocalMatch(match, sim);
      const snap = sim.getCurrentSnapshot();
      const cyan = snap.blocks.find((b) => b.id === "block_cyan");
      const orange = snap.blocks.find((b) => b.id === "block_orange");
      if (!cyan || !orange) continue;
      maxCyanY = Math.max(maxCyanY, cyan.position[1]);
      if (snap.graspedBlockId === "block_cyan") {
        graspedCyan = true;
        minHeldGap = Math.min(minHeldGap, vecDist(cyan.position, snap.arm.tcp.position));
        orangeShiftDuringCyan = Math.max(orangeShiftDuringCyan, vecDist(orange.position, orangeSpawn));
      }
      if (snap.graspedBlockId === "block_orange" || result) break;
    }

    sim.dispose();

    expect(graspedCyan, `never grasped cyan; last ${match.agent.lastPlan}`).toBe(true);
    expect(minHeldGap, "held cube must sit at the TCP pinch").toBeLessThan(0.02);
    expect(maxCyanY, "cyan should leave the table with the gripper").toBeGreaterThan(cyanSpawn[1] + 0.08);
    expect(orangeShiftDuringCyan, "orange should stay put while cyan is carried").toBeLessThan(0.08);
  }, 30000);
});

describe("ColorSeek in the physics loop", () => {
  it("grasps cyan instead of pinching air", async () => {
    const sim = await ArenaSimulation.create();
    const input = createInputBuffer();
    const match = createLocalMatch("vla");
    let graspedCyan = false;

    for (let i = 0; i < 1800; i += 1) {
      sim.step(FIXED_DT, input);
      stepLocalMatch(match, sim);
      if (sim.getCurrentSnapshot().graspedBlockId === "block_cyan") {
        graspedCyan = true;
        break;
      }
    }

    const last = match.agent.lastPlan;
    sim.dispose();
    expect(graspedCyan, `never grasped cyan; last ${last}`).toBe(true);
  }, 40000);

  it("releases cyan on the stack pad, not at the pick pose", async () => {
    const sim = await ArenaSimulation.create();
    const input = createInputBuffer();
    const match = createLocalMatch("vla");
    let sawGrasp = false;
    let placed: number | null = null;

    for (let i = 0; i < 2200; i += 1) {
      sim.step(FIXED_DT, input);
      stepLocalMatch(match, sim);
      const snap = sim.getCurrentSnapshot();
      const cyan = snap.blocks.find((b) => b.id === "block_cyan");
      if (!cyan) continue;
      if (snap.graspedBlockId === "block_cyan") sawGrasp = true;
      if (sawGrasp && snap.graspedBlockId !== "block_cyan") {
        placed = Math.hypot(cyan.position[0] - STACK_ORIGIN[0], cyan.position[2] - STACK_ORIGIN[2]);
        break;
      }
    }

    const last = match.agent.lastPlan;
    sim.dispose();
    expect(placed, `never released cyan; last ${last}`).not.toBeNull();
    expect(placed, `cyan landed ${placed}m from pad; last ${last}`).toBeLessThan(0.07);
  }, 45000);

  it("releases magenta instead of hitting the match clock mid-place", async () => {
    const sim = await ArenaSimulation.create();
    const input = createInputBuffer();
    const match = createLocalMatch("vla");
    let releasedMagenta = false;
    let last = "";

    for (let i = 0; i < 3200; i += 1) {
      sim.step(FIXED_DT, input);
      const result = stepLocalMatch(match, sim);
      last = match.agent.lastPlan;
      const snap = sim.getCurrentSnapshot();
      if (snap.graspedBlockId === "block_magenta") releasedMagenta = false;
      if (last.startsWith("Release magenta") && snap.graspedBlockId !== "block_magenta") {
        releasedMagenta = true;
        break;
      }
      if (result && snap.graspedBlockId === "block_magenta") {
        break;
      }
    }

    sim.dispose();
    expect(releasedMagenta, `magenta still held or never placed; last ${last}`).toBe(true);
  }, 60000);
});

describe("ArenaSimulation table containment", () => {
  it("keeps cubes and TCP on the table after settling", async () => {
    const sim = await ArenaSimulation.create();
    const input = createInputBuffer();
    for (let i = 0; i < 90; i += 1) {
      sim.step(FIXED_DT, input);
    }
    for (const block of sim.getCurrentSnapshot().blocks) {
      expect(block.position[1], block.id).toBeGreaterThanOrEqual(TABLE_TOP_Y);
    }
    expect(sim.getCurrentSnapshot().arm.tcp.position[1]).toBeGreaterThanOrEqual(TABLE_TOP_Y);
    sim.dispose();
  }, 20000);

  it("does not shove spawn cubes while the open gripper stays in the ready pose", async () => {
    const sim = await ArenaSimulation.create();
    const input = createInputBuffer();
    for (let i = 0; i < 60; i += 1) {
      sim.step(FIXED_DT, input);
    }
    for (const spawn of BLOCK_SPAWNS) {
      const now = sim.getCurrentSnapshot().blocks.find((b) => b.id === spawn.id);
      expect(now, spawn.id).toBeDefined();
      expect(vecDist(now!.position, spawn.position), spawn.id).toBeLessThan(0.04);
    }
    sim.dispose();
  }, 20000);
});
