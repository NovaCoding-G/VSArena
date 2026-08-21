import { describe, expect, it } from "vitest";
import { buildClipCaption } from "@/lib/clip/caption";
import { coverRect, formatClipClock } from "@/lib/clip/formats";

describe("coverRect", () => {
  it("crops a wide source into 9:16", () => {
    const crop = coverRect(1920, 1080, 720, 1280);
    expect(crop.sh).toBe(1080);
    expect(crop.sw).toBeCloseTo(1080 * (720 / 1280));
    expect(crop.sy).toBe(0);
    expect(crop.sx).toBeGreaterThan(0);
  });

  it("crops a tall source into 16:9", () => {
    const crop = coverRect(720, 1280, 1280, 720);
    expect(crop.sw).toBe(720);
    expect(crop.sy).toBeGreaterThan(0);
  });
});

describe("buildClipCaption", () => {
  it("includes scores when a result exists", () => {
    const text = buildClipCaption({
      agent: "Baseline-IK",
      format: "reels",
      result: {
        type: "result",
        match_id: "m1",
        status: "completed",
        scores: {
          spatial_accuracy: 0.94,
          task_completion_score: 1,
          joint_torque_telemetry: { peak: 1, avg: 0.4 },
        },
        elo_delta: 18,
      },
    });
    expect(text).toContain("Baseline-IK");
    expect(text).toContain("Complete 1.000");
    expect(text).toContain("ELO +18");
    expect(text).toContain("#VSArena");
    expect(text).toContain("NovaCoding-G");
    expect(text).toContain("Reels");
  });
});

describe("formatClipClock", () => {
  it("pads seconds", () => {
    expect(formatClipClock(0)).toBe("0:00");
    expect(formatClipClock(65_000)).toBe("1:05");
  });
});
