// Assumption: uses existing MVP tables (no slug column). Slugs are derived from agent.name.

import { createAdminSupabase } from "@/lib/supabase/admin";
import { dedupeAgentRows } from "@/lib/matches/dedupe";
import { agentSlug, type ArenaAgent, type StoredMatch } from "@/lib/matches/memory";
import { isPublicLeaderboardAgent } from "@/lib/matches/placeholders";
import { eloDelta } from "@/lib/scoring/elo";
import { ensureProfile } from "@/lib/supabase/profile";

const HOUSE_EMAIL = "house@vsarena.dev";
const HOUSE_USERNAME = "vsarena-house";

export const HOUSE_AGENTS: Array<{ name: string; description: string; repo_url: string }> = [
  {
    name: "Baseline-IK",
    description: "Geometric inverse-kinematics reference (state track, not a VLA).",
    repo_url: "https://github.com/NovaCoding-G/novanexus",
  },
];

interface AgentRow {
  id: string;
  name: string;
  elo_rating: number | null;
  created_at?: string | null;
  matches?: Array<{ count: number }>;
}

function toArenaAgent(row: AgentRow): ArenaAgent {
  const matches = row.matches?.[0]?.count ?? 0;
  return {
    slug: agentSlug(row.name),
    name: row.name,
    elo: row.elo_rating ?? 1200,
    matches,
    status: matches > 0 ? "live" : "seed",
  };
}

async function houseOwnerId(): Promise<string> {
  const admin = createAdminSupabase();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", HOUSE_USERNAME)
    .maybeSingle();
  if (profileError) throw profileError;
  if (profile?.id) return profile.id as string;

  const { data: anyProfile, error: anyError } = await admin.from("profiles").select("id").limit(1).maybeSingle();
  if (anyError) throw anyError;
  if (anyProfile?.id) return anyProfile.id as string;

  const created = await admin.auth.admin.createUser({
    email: HOUSE_EMAIL,
    email_confirm: true,
    user_metadata: { user_name: HOUSE_USERNAME },
  });
  if (created.error && !created.error.message.toLowerCase().includes("already")) {
    throw created.error;
  }
  const userId =
    created.data.user?.id ??
    (await (async () => {
      const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (listed.error) throw listed.error;
      const found = listed.data.users.find((user) => user.email === HOUSE_EMAIL);
      if (!found) throw new Error("house auth user missing");
      return found.id;
    })());

  const { data: user } = await admin.auth.admin.getUserById(userId);
  if (user.user) await ensureProfile(user.user);
  else {
    const { error } = await admin.from("profiles").upsert({
      id: userId,
      username: HOUSE_USERNAME,
      github_url: "https://github.com/NovaCoding-G",
    });
    if (error) throw error;
  }
  return userId;
}

/**
 * Upsert house seed agents. Uses ON CONFLICT so concurrent serverless cold starts cannot duplicate rows.
 *
 * @example await ensureHouseAgents()
 */
export async function ensureHouseAgents(): Promise<void> {
  const admin = createAdminSupabase();
  const ownerId = await houseOwnerId();
  const { error: upsertError } = await admin.from("agents").upsert(
    HOUSE_AGENTS.map((agent) => ({
      owner_id: ownerId,
      name: agent.name,
      description: agent.description,
      repo_url: agent.repo_url,
      elo_rating: 1200,
    })),
    { onConflict: "name", ignoreDuplicates: true },
  );
  if (upsertError) throw upsertError;
}

async function loadAgents(): Promise<AgentRow[]> {
  const admin = createAdminSupabase();
  const { data: agents, error } = await admin.from("agents").select("id, name, elo_rating, created_at");
  if (error) throw error;
  const { data: matchRows, error: matchError } = await admin.from("matches").select("agent_id");
  if (matchError) throw matchError;
  const counts = new Map<string, number>();
  for (const row of matchRows ?? []) {
    const id = String(row.agent_id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const rows = (agents ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    elo_rating: (row.elo_rating as number | null) ?? 1200,
    created_at: row.created_at ? String(row.created_at) : null,
    matches: [{ count: counts.get(String(row.id)) ?? 0 }],
  }));
  return dedupeAgentRows(rows);
}

/**
 * Ranked public table from Postgres.
 *
 * @example const rows = await listLeaderboardPostgres()
 */
export async function listLeaderboardPostgres(): Promise<Array<ArenaAgent & { rank: number }>> {
  await ensureHouseAgents();
  const rows = await loadAgents();
  return rows
    .map(toArenaAgent)
    .filter((agent) => isPublicLeaderboardAgent(agent.slug))
    .sort((a, b) => b.elo - a.elo || b.matches - a.matches || a.name.localeCompare(b.name))
    .map((agent, index) => ({ ...agent, rank: index + 1 }));
}

export async function getAgentPostgres(slug: string): Promise<ArenaAgent | undefined> {
  const rows = await loadAgents();
  return rows.map(toArenaAgent).find((agent) => agent.slug === slug);
}

export async function listMatchesForAgentPostgres(slug: string): Promise<StoredMatch[]> {
  const admin = createAdminSupabase();
  const rows = await loadAgents();
  const agent = rows.find((row) => agentSlug(row.name) === slug);
  if (!agent) return [];
  const { data, error } = await admin
    .from("matches")
    .select("id, status, spatial_accuracy, task_completion_score, joint_torque_telemetry, elo_delta, created_at, completed_at")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const telemetry = (row.joint_torque_telemetry ?? { peak: 0, avg: 0 }) as { peak: number; avg: number };
    return {
      type: "result" as const,
      match_id: String(row.id),
      status: row.status === "failed" ? ("failed" as const) : ("completed" as const),
      scores: {
        spatial_accuracy: Number(row.spatial_accuracy ?? 0),
        task_completion_score: Number(row.task_completion_score ?? 0),
        joint_torque_telemetry: { peak: Number(telemetry.peak ?? 0), avg: Number(telemetry.avg ?? 0) },
      },
      elo_delta: Number(row.elo_delta ?? 0),
      agent: agent.name,
      agent_slug: agentSlug(agent.name),
      stored_at: String(row.completed_at ?? row.created_at),
    };
  });
}

export async function listMatchesPostgres(): Promise<StoredMatch[]> {
  const agents = await loadAgents();
  const byId = new Map(agents.map((row) => [row.id, row]));
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("matches")
    .select("id, agent_id, status, spatial_accuracy, task_completion_score, joint_torque_telemetry, elo_delta, created_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const agent = byId.get(String(row.agent_id));
    if (!agent) return [];
    const telemetry = (row.joint_torque_telemetry ?? { peak: 0, avg: 0 }) as { peak: number; avg: number };
    return [
      {
        type: "result" as const,
        match_id: String(row.id),
        status: row.status === "failed" ? ("failed" as const) : ("completed" as const),
        scores: {
          spatial_accuracy: Number(row.spatial_accuracy ?? 0),
          task_completion_score: Number(row.task_completion_score ?? 0),
          joint_torque_telemetry: { peak: Number(telemetry.peak ?? 0), avg: Number(telemetry.avg ?? 0) },
        },
        elo_delta: Number(row.elo_delta ?? 0),
        agent: agent.name,
        agent_slug: agentSlug(agent.name),
        stored_at: String(row.completed_at ?? row.created_at),
      },
    ];
  });
}

/**
 * Persist a result, update ELO, return the stored row. Service-role only.
 *
 * @example await recordMatchPostgres({ agent: "Baseline-IK", ...result })
 */
export async function recordMatchPostgres(
  entry: Omit<StoredMatch, "elo_delta" | "agent_slug" | "stored_at"> & { agent: string },
): Promise<StoredMatch> {
  await ensureHouseAgents();
  const admin = createAdminSupabase();
  const slug = agentSlug(entry.agent);
  const rows = await loadAgents();
  let row = rows.find((item) => agentSlug(item.name) === slug);
  if (!row) {
    const ownerId = await houseOwnerId();
    const { error: upsertError } = await admin.from("agents").upsert(
      {
        owner_id: ownerId,
        name: entry.agent,
        elo_rating: 1200,
      },
      { onConflict: "name", ignoreDuplicates: true },
    );
    if (upsertError) throw upsertError;
    const reloaded = await loadAgents();
    row = reloaded.find((item) => agentSlug(item.name) === slug);
    if (!row) throw new Error("agent upsert failed");
  }

  const matchesPlayed = row.matches?.[0]?.count ?? 0;
  const rating = row.elo_rating ?? 1200;
  const outcome = entry.status === "failed" ? 0 : entry.scores.task_completion_score;
  const delta = eloDelta(rating, outcome, matchesPlayed);
  const now = new Date().toISOString();

  const { error: eloError } = await admin.from("agents").update({ elo_rating: rating + delta }).eq("id", row.id);
  if (eloError) throw eloError;

  const insert: Record<string, unknown> = {
    agent_id: row.id,
    task_type: "block_stacking",
    spatial_accuracy: entry.scores.spatial_accuracy,
    task_completion_score: entry.scores.task_completion_score,
    joint_torque_telemetry: entry.scores.joint_torque_telemetry,
    elo_delta: delta,
    status: entry.status,
    completed_at: now,
  };
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entry.match_id)) {
    insert.id = entry.match_id;
  }

  const { error: matchError } = await admin.from("matches").insert(insert);
  if (matchError) throw matchError;

  return {
    ...entry,
    elo_delta: delta,
    agent: row.name,
    agent_slug: slug,
    stored_at: now,
  };
}
