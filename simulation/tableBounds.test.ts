import { describe, expect, it } from "vitest";
import { DEFAULT_JOINTS, TABLE_TOP_Y } from "@/simulation/constants";
import { forwardKinematics } from "@/simulation/armKinematics";
import { inverseKinematics } from "@/simulation/inverseKinematics";
import {
  armClearsTable,
  GROUPS_ARM,
  GROUPS_BLOCK,
  GROUPS_BLOCK_HELD,
  isOverTable,
  LAYER_ARM,
  LAYER_BLOCK,
  minBlockCenterY,
} from "@/simulation/tableBounds";

describe("tableBounds", () => {
  it("treats the origin as on the table", () => {
    expect(isOverTable(0, 0)).toBe(true);
    expect(isOverTable(3, 0)).toBe(false);
  });

  it("keeps block centers on the table surface", () => {
    expect(minBlockCenterY(0, 0)).toBeGreaterThan(TABLE_TOP_Y);
  });

  it("default pose stays above the table", () => {
    expect(armClearsTable(forwardKinematics(DEFAULT_JOINTS))).toBe(true);
  });

  it("keeps the kinematic arm from shoving free cubes", () => {
    const filter = 0xffff;
    expect(GROUPS_ARM & filter & LAYER_BLOCK).toBe(0);
    expect(GROUPS_BLOCK & filter & LAYER_ARM).toBe(0);
    expect(GROUPS_BLOCK_HELD & filter & LAYER_ARM).toBe(0);
    expect(GROUPS_BLOCK_HELD & filter & LAYER_BLOCK).toBe(0);
  });
});

describe("inverseKinematics table clamp", () => {
  it("does not aim the TCP under the table top", () => {
    const ik = inverseKinematics([0.3, 0.1, 0], 0);
    const tcp = forwardKinematics(ik).tcp.position;
    expect(tcp[1]).toBeGreaterThanOrEqual(TABLE_TOP_Y);
    expect(armClearsTable(forwardKinematics(ik))).toBe(true);
  });
});
