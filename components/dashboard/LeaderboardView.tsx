"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { LeaderboardTable } from "@/components/dashboard/LeaderboardTable";
import { PageFrame } from "@/components/layout/PageFrame";
import type { ArenaAgent } from "@/lib/matches/memory";

/**
 * Localized public ELO table.
 *
 * @example <LeaderboardView rows={rows} />
 */
export function LeaderboardView({ rows }: { rows: Array<ArenaAgent & { rank: number }> }) {
  const { m } = useI18n();
  const b = m.board;

  return (
    <PageFrame kicker={b.kicker} title={b.title}>
      <p className="-mt-2 max-w-2xl text-lg leading-8 text-arena-muted">
        {b.lead}{" "}
        <Link className="text-arena-cyan hover:text-white" href="/submit">
          {b.leadLink}
        </Link>{" "}
        {b.leadAfter}
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-arena-muted">{b.note}</p>
      {rows.length === 0 ? (
        <p className="panel mt-6 px-5 py-8 text-sm text-arena-muted">{b.empty}</p>
      ) : (
        <LeaderboardTable rows={rows} />
      )}
    </PageFrame>
  );
}
