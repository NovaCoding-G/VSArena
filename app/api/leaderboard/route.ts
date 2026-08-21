import { NextResponse } from "next/server";
import { listLeaderboard } from "@/lib/matches/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ agents: await listLeaderboard() });
}
