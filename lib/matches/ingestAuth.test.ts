import { describe, expect, it } from "vitest";
import { ingestConfigured, requestHasIngestSecret } from "@/lib/matches/ingestAuth";

describe("harness ingest auth", () => {
  it("rejects short or missing secrets", () => {
    const prev = process.env.HARNESS_INGEST_SECRET;
    try {
      process.env.HARNESS_INGEST_SECRET = "short";
      expect(ingestConfigured()).toBe(false);
    } finally {
      process.env.HARNESS_INGEST_SECRET = prev;
    }
  });

  it("accepts a matching header when the secret is long enough", () => {
    const prev = process.env.HARNESS_INGEST_SECRET;
    try {
      process.env.HARNESS_INGEST_SECRET = "test-ingest-secret-ok";
      const request = new Request("http://localhost/api/matches", {
        headers: { "x-vsarena-ingest": "test-ingest-secret-ok" },
      });
      expect(requestHasIngestSecret(request)).toBe(true);
      const bad = new Request("http://localhost/api/matches", {
        headers: { "x-vsarena-ingest": "nope-ingest-secret-ok" },
      });
      expect(requestHasIngestSecret(bad)).toBe(false);
    } finally {
      process.env.HARNESS_INGEST_SECRET = prev;
    }
  });
});
