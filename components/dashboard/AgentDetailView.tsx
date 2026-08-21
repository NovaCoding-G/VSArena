"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { Badge } from "@/components/ui/badge";
import type { ArenaAgent, StoredMatch } from "@/lib/matches/memory";

/**
 * Localized agent detail + match history.
 *
 * @example <AgentDetailView agent={agent} history={history} />
 */
export function AgentDetailView({ agent, history }: { agent: ArenaAgent; history: StoredMatch[] }) {
  const { m } = useI18n();
  const b = m.board;
  const statusLabel = agent.status === "live" ? b.statusLive : b.statusSeed;

  function matchStatus(status: string): string {
    if (status === "completed") return b.matchCompleted;
    if (status === "pending") return b.matchPending;
    if (status === "running") return b.matchRunning;
    if (status === "failed") return b.matchFailed;
    return status;
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-16">
      <Link href="/leaderboard" className="text-sm text-arena-muted hover:text-white">
        {b.back}
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-arena-cyan">{b.agentKicker}</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight text-white">{agent.name}</h1>
        </div>
        <Badge variant={agent.status === "live" ? "cyan" : "muted"}>{statusLabel}</Badge>
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="panel px-5 py-4">
          <dt className="text-sm text-arena-muted">{b.colElo}</dt>
          <dd className="mt-1 text-3xl font-semibold text-white">{agent.elo}</dd>
        </div>
        <div className="panel px-5 py-4">
          <dt className="text-sm text-arena-muted">{b.colMatches}</dt>
          <dd className="mt-1 text-3xl font-semibold text-white">{agent.matches}</dd>
        </div>
      </dl>
      <h2 className="mt-12 text-sm font-medium text-arena-muted">{b.history}</h2>
      <div className="panel mt-3 overflow-x-auto">
        {history.length === 0 ? (
          <p className="px-5 py-8 text-sm text-arena-muted">{b.historyEmpty}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-arena-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{b.colWhen}</th>
                <th className="px-4 py-3 font-medium">{b.colStatus}</th>
                <th className="px-4 py-3 font-medium">{b.colComplete}</th>
                <th className="px-4 py-3 font-medium">{b.colSpatial}</th>
                <th className="px-4 py-3 font-medium">{b.colDelta}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((match) => (
                <tr key={match.match_id} className="border-b border-white/5">
                  <td className="px-4 py-3 text-arena-muted">{match.stored_at.slice(11, 19)}</td>
                  <td className="px-4 py-3">{matchStatus(match.status)}</td>
                  <td className="px-4 py-3">{match.scores.task_completion_score.toFixed(3)}</td>
                  <td className="px-4 py-3">{match.scores.spatial_accuracy.toFixed(3)}</td>
                  <td className={`px-4 py-3 ${match.elo_delta >= 0 ? "text-arena-cyan" : "text-arena-orange"}`}>
                    {match.elo_delta >= 0 ? "+" : ""}
                    {match.elo_delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
