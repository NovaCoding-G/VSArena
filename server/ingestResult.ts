// Assumption: Next app is reachable from this process (local: http://127.0.0.1:3000).

import type { ResultMessage } from "../lib/harness/protocol";

/**
 * POST a harness-scored result to the Next ingest endpoint.
 *
 * @example await ingestOfficialResult({ agent: "my-bot", result })
 */
export async function ingestOfficialResult(agent: string, result: ResultMessage): Promise<void> {
  const secret = (process.env.HARNESS_INGEST_SECRET ?? "").trim();
  const base = (process.env.VSARENA_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  if (secret.length < 16) {
    console.warn("[vsarena-harness] HARNESS_INGEST_SECRET unset (<16 chars) — leaderboard not updated");
    return;
  }
  try {
    const res = await fetch(`${base}/api/matches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vsarena-ingest": secret,
      },
      body: JSON.stringify({
        type: "result",
        match_id: result.match_id,
        status: result.status,
        scores: result.scores,
        agent,
      }),
    });
    if (!res.ok) {
      console.error("[vsarena-harness] ingest failed", res.status, await res.text());
      return;
    }
    const stored = (await res.json()) as { elo_delta?: number };
    if (typeof stored.elo_delta === "number") {
      result.elo_delta = stored.elo_delta;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "ingest failed";
    console.error("[vsarena-harness] ingest error", message);
  }
}
