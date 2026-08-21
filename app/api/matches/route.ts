import { NextResponse } from "next/server";
import { listMatches, recordMatch } from "@/lib/matches/store";
import { requestHasIngestSecret } from "@/lib/matches/ingestAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ matches: await listMatches() });
}

/**
 * Official leaderboard write. Only the harness (ingest secret) may POST.
 * In-browser Baseline-IK is a demo and does not mutate ELO.
 *
 * @example POST /api/matches  header x-vsarena-ingest
 */
export async function POST(request: Request) {
  if (!requestHasIngestSecret(request)) {
    return NextResponse.json(
      { error: "leaderboard writes are harness-only (missing x-vsarena-ingest)" },
      { status: 403 },
    );
  }
  try {
    const body = (await request.json()) as {
      agent?: string;
      type?: string;
      match_id?: string;
      status?: "completed" | "failed";
      scores?: {
        spatial_accuracy: number;
        task_completion_score: number;
        joint_torque_telemetry: { peak: number; avg: number };
      };
    };
    if (!body.match_id || !body.scores || body.type !== "result") {
      return NextResponse.json({ error: "invalid result payload" }, { status: 400 });
    }
    const stored = await recordMatch({
      type: "result",
      match_id: body.match_id,
      status: body.status === "failed" ? "failed" : "completed",
      scores: body.scores,
      agent: body.agent ?? "unknown",
    });
    return NextResponse.json(stored, { status: 201 });
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
}
