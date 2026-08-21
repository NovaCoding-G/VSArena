"use client";

import { Badge } from "@/components/ui/badge";
import { useHudStore } from "@/lib/store";

export function DecisionLog() {
  const logs = useHudStore((s) => s.logs);
  const ready = useHudStore((s) => s.ready);

  return (
    <div className="panel pointer-events-auto max-h-40 w-[min(100%,16rem)] overflow-hidden backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <p className="text-xs font-medium text-white">Log</p>
        <Badge variant={ready ? "cyan" : "muted"}>{ready ? "Live" : "Boot"}</Badge>
      </div>
      <ul className="max-h-28 overflow-y-auto px-3 py-2 text-[11px] leading-5 text-arena-muted">
        {logs.map((line, i) => (
          <li key={`${line}-${i}`} className={i === logs.length - 1 ? "text-arena-fg" : undefined}>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
