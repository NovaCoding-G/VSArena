import {
  getAgent as getAgentMemory,
  listLeaderboard as listLeaderboardMemory,
  listMatches as listMatchesMemory,
  listMatchesForAgent as listMatchesForAgentMemory,
  recordMatch as recordMatchMemory,
  type ArenaAgent,
  type StoredMatch,
} from "@/lib/matches/memory";
import { hasServiceRole } from "@/lib/supabase/env";
import {
  getAgentPostgres,
  listLeaderboardPostgres,
  listMatchesForAgentPostgres,
  listMatchesPostgres,
  recordMatchPostgres,
} from "@/lib/matches/postgres";

export type { ArenaAgent, StoredMatch };

function logFallback(scope: string, error: unknown): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);
  console.error(`[matches] ${scope} falling back to memory:`, message);
}

/**
 * Record a scored match. Prefers Postgres (service role); RAM if keys/tables fail.
 *
 * @example await recordMatch({ agent: "Baseline-IK", ...result })
 */
export async function recordMatch(
  entry: Omit<StoredMatch, "elo_delta" | "agent_slug" | "stored_at"> & { agent: string },
): Promise<StoredMatch> {
  if (hasServiceRole()) {
    try {
      return await recordMatchPostgres(entry);
    } catch (error) {
      logFallback("recordMatch", error);
    }
  }
  return recordMatchMemory(entry);
}

export async function listMatches(): Promise<StoredMatch[]> {
  if (hasServiceRole()) {
    try {
      return await listMatchesPostgres();
    } catch (error) {
      logFallback("listMatches", error);
    }
  }
  return listMatchesMemory();
}

export async function listMatchesForAgent(slug: string): Promise<StoredMatch[]> {
  if (hasServiceRole()) {
    try {
      return await listMatchesForAgentPostgres(slug);
    } catch (error) {
      logFallback("listMatchesForAgent", error);
    }
  }
  return listMatchesForAgentMemory(slug);
}

export async function getAgent(slug: string): Promise<ArenaAgent | undefined> {
  if (hasServiceRole()) {
    try {
      return await getAgentPostgres(slug);
    } catch (error) {
      logFallback("getAgent", error);
    }
  }
  return getAgentMemory(slug);
}

/**
 * Ranked leaderboard. Postgres when the service role is set.
 *
 * @example const rows = await listLeaderboard()
 */
export async function listLeaderboard(): Promise<Array<ArenaAgent & { rank: number }>> {
  if (hasServiceRole()) {
    try {
      return await listLeaderboardPostgres();
    } catch (error) {
      logFallback("listLeaderboard", error);
    }
  }
  return listLeaderboardMemory();
}
