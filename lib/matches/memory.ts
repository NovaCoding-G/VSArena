// Assumption: in-memory only — swap for Supabase service-role inserts when keys exist.

import type { ResultMessage } from "@/lib/harness/protocol";
import { eloDelta } from "@/lib/scoring/elo";
import { isPublicLeaderboardAgent } from "@/lib/matches/placeholders";

export interface ArenaAgent {
  slug: string;
  name: string;
  elo: number;
  matches: number;
  status: "seed" | "live";
}

export interface StoredMatch extends ResultMessage {
  agent: string;
  agent_slug: string;
  stored_at: string;
}

const MAX = 80;

const agents: ArenaAgent[] = [
  { slug: "baseline-ik", name: "Baseline-IK", elo: 1200, matches: 0, status: "seed" },
];

const matches: StoredMatch[] = [];

/**
 * URL slug from an agent display name.
 *
 * @example agentSlug("Baseline-IK") // "baseline-ik"
 */
export function agentSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureAgent(name: string): ArenaAgent {
  const slug = agentSlug(name);
  const existing = agents.find((agent) => agent.slug === slug);
  if (existing) return existing;
  const created: ArenaAgent = { slug, name, elo: 1200, matches: 0, status: "live" };
  agents.push(created);
  return created;
}

/**
 * Store a match and update the agent's ELO vs the task (rating 1200).
 *
 * @example recordMatch({ agent: "Baseline-IK", ...result })
 */
export function recordMatch(entry: Omit<StoredMatch, "elo_delta" | "agent_slug" | "stored_at"> & { agent: string }): StoredMatch {
  const agent = ensureAgent(entry.agent);
  const outcome = entry.status === "failed" ? 0 : entry.scores.task_completion_score;
  const delta = eloDelta(agent.elo, outcome, agent.matches);
  agent.elo += delta;
  agent.matches += 1;
  agent.status = "live";

  const stored: StoredMatch = {
    ...entry,
    elo_delta: delta,
    agent: agent.name,
    agent_slug: agent.slug,
    stored_at: new Date().toISOString(),
  };
  matches.unshift(stored);
  if (matches.length > MAX) matches.pop();
  return stored;
}

export function listMatches(): StoredMatch[] {
  return [...matches];
}

export function listMatchesForAgent(slug: string): StoredMatch[] {
  return matches.filter((match) => match.agent_slug === slug);
}

export function getAgent(slug: string): ArenaAgent | undefined {
  return agents.find((agent) => agent.slug === slug);
}

/**
 * Ranked snapshot for the public table.
 *
 * @example listLeaderboard()[0].rank
 */
export function listLeaderboard(): Array<ArenaAgent & { rank: number }> {
  const ranked = [...agents]
    .filter((agent) => isPublicLeaderboardAgent(agent.slug))
    .sort((a, b) => b.elo - a.elo || b.matches - a.matches || a.name.localeCompare(b.name));
  return ranked.map((agent, index) => ({ ...agent, rank: index + 1 }));
}
