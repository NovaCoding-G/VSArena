import { describe, expect, it } from "vitest";
import { dedupeAgentRows } from "@/lib/matches/dedupe";

describe("dedupeAgentRows", () => {
  it("keeps the row with more matches", () => {
    const kept = { id: "b", name: "Baseline-IK", elo_rating: 1210, matches: [{ count: 2 }] };
    const dropped = { id: "a", name: "Baseline-IK", elo_rating: 1200, matches: [{ count: 0 }] };
    expect(dedupeAgentRows([dropped, kept])).toEqual([kept]);
  });

  it("keeps the oldest row when match counts tie", () => {
    const older = {
      id: "a",
      name: "Baseline-IK",
      elo_rating: 1200,
      created_at: "2026-01-01T00:00:00Z",
      matches: [{ count: 0 }],
    };
    const newer = {
      id: "b",
      name: "Baseline-IK",
      elo_rating: 1200,
      created_at: "2026-02-01T00:00:00Z",
      matches: [{ count: 0 }],
    };
    expect(dedupeAgentRows([newer, older])).toEqual([older]);
  });
});
