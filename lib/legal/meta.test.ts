import { describe, expect, it } from "vitest";
import { fillLegal } from "@/lib/legal/meta";

describe("fillLegal", () => {
  it("interpolates controller and github", () => {
    const text = fillLegal("Titolare: {controller}. Repo: {github}", {
      controller: "Ada",
      email: "ada@example.com",
      github: "https://github.com/NovaCoding-G",
      updatedIt: "21 agosto 2026",
      updatedEn: "21 August 2026",
    });
    expect(text).toContain("Ada");
    expect(text).toContain("https://github.com/NovaCoding-G");
  });
});
