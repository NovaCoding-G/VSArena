"use client";

import { ArenaCanvas } from "@/components/simulation/ArenaCanvas";
import { useHudStore } from "@/lib/store";

/** Canvas + boot overlay. Dashboard chrome lives outside this shell. */
export default function ArenaApp() {
  const ready = useHudStore((s) => s.ready);
  const error = useHudStore((s) => s.error);

  return (
    <div className="relative h-full min-h-[280px] w-full">
      <ArenaCanvas />
      {error ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#07080b]/80 px-6 text-center">
          <p className="text-sm font-medium text-arena-orange">Physics failed to start</p>
          <p className="max-w-md text-sm text-red-400">{error}</p>
          <p className="max-w-md text-xs text-arena-muted">
            Hard-refresh (Ctrl+Shift+R). If it persists, stop other localhost:3000 processes and restart npm run dev.
          </p>
        </div>
      ) : !ready ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#07080b]/50">
          <p className="text-sm text-arena-muted">Initializing physics…</p>
        </div>
      ) : null}
    </div>
  );
}
