"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/LocaleProvider";
import type { ArenaAgent } from "@/lib/matches/memory";

type SortKey = "rank" | "name" | "elo" | "matches";

interface Row extends ArenaAgent {
  rank: number;
}

/**
 * Sortable public table. Click a header to toggle.
 *
 * @example <LeaderboardTable rows={rows} />
 */
export function LeaderboardTable({ rows }: { rows: Row[] }) {
  const { m } = useI18n();
  const b = m.board;
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "rank", dir: "asc" });

  const ordered = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "name") return dir * a.name.localeCompare(b.name);
      return dir * (a[sort.key] - b[sort.key]);
    });
    return copy;
  }, [rows, sort]);

  function header(key: SortKey, label: string) {
    const active = sort.key === key;
    return (
      <th className="px-4 py-3">
        <button
          type="button"
          className="text-xs font-medium text-arena-muted hover:text-white"
          onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))}
        >
          {label}
          {active ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
        </button>
      </th>
    );
  }

  return (
    <div className="panel mt-6 overflow-x-auto">
      <table className="w-full text-left font-mono text-sm">
        <thead className="border-b border-arena-cyan/20 text-[10px]">
          <tr>
            {header("rank", b.colRank)}
            {header("name", b.colAgent)}
            {header("elo", b.colElo)}
            {header("matches", b.colMatches)}
            <th className="px-4 py-3 text-xs font-medium text-arena-muted">{b.colStatus}</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => (
            <tr key={row.slug} className="border-b border-white/5 text-arena-fg">
              <td className="px-4 py-3 text-arena-orange">{row.rank}</td>
              <td className="px-4 py-3">
                <Link href={`/leaderboard/${row.slug}`} className="text-arena-cyan hover:text-white">
                  {row.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-arena-cyan">{row.elo}</td>
              <td className="px-4 py-3 text-arena-muted">{row.matches}</td>
              <td className="px-4 py-3">
                <Badge variant={row.status === "live" ? "cyan" : "muted"}>
                  {row.status === "live" ? b.statusLive : b.statusSeed}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
