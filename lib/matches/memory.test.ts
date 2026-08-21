import { describe, expect, it } from "vitest";
import { listLeaderboard, recordMatch } from "@/lib/matches/memory";

describe("in-memory leaderboard", () => {
  it("applies a positive ELO delta on a full completion", () => {
    const before = listLeaderboard().find((row) => row.slug === "baseline-ik");
    const stored = recordMatch({
      type: "result",
      match_id: "test-elo-1",
      status: "completed",
      scores: {
        spatial_accuracy: 0.99,
        task_completion_score: 1,
        joint_torque_telemetry: { peak: 1, avg: 0.4 },
      },
      agent: "Baseline-IK",
    });
    const after = listLeaderboard().find((row) => row.slug === "baseline-ik");
    expect(stored.elo_delta).toBeGreaterThan(0);
    expect(after?.elo).toBe((before?.elo ?? 1200) + stored.elo_delta);
    expect(after?.matches).toBe((before?.matches ?? 0) + 1);
  });
});
