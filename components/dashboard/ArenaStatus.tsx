"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { formatClipClock } from "@/lib/clip/formats";
import { useClipStore } from "@/lib/clip/store";
import { useHudStore } from "@/lib/store";

/**
 * Live chip over the studio — task name, status, tick.
 *
 * @example <ArenaStatus />
 */
export function ArenaStatus() {
  const { m } = useI18n();
  const ready = useHudStore((s) => s.ready);
  const status = useHudStore((s) => s.matchStatus);
  const tick = useHudStore((s) => s.tick);
  const result = useHudStore((s) => s.matchResult);
  const clipPhase = useClipStore((s) => s.phase);
  const startedAt = useClipStore((s) => s.startedAt);
  const recording = clipPhase === "recording" || clipPhase === "endcard";
  const [, bump] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => bump((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, [recording]);

  return (
    <div className="panel flex items-center gap-3 px-3 py-2 backdrop-blur-xl">
      <div>
        <p className="text-[11px] text-arena-muted">{m.studio.kicker}</p>
        <p className="text-sm font-medium text-white">{m.studio.stackingName}</p>
      </div>
      <span className="h-8 w-px bg-white/10" />
      <Badge variant={status === "running" ? "orange" : status === "completed" ? "cyan" : "muted"}>
        {ready ? status : "boot"}
      </Badge>
      <p className="hidden font-mono text-[11px] text-arena-muted sm:block">tick {tick}</p>
      {recording ? (
        <p className="flex items-center gap-1.5 font-mono text-[11px] text-arena-orange">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-arena-orange" />
          {clipPhase === "endcard" ? "End card" : "Rec"} {formatClipClock(performance.now() - startedAt)}
        </p>
      ) : null}
      {result && status !== "running" ? (
        <p className="hidden font-mono text-[11px] text-white md:block">
          {result.scores.spatial_accuracy.toFixed(2)} spatial · {result.scores.task_completion_score.toFixed(2)} complete
        </p>
      ) : null}
    </div>
  );
}
