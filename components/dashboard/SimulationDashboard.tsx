"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ArenaDock } from "@/components/dashboard/ArenaDock";
import { ArenaStatus } from "@/components/dashboard/ArenaStatus";
import { ClipExportModal } from "@/components/dashboard/ClipExportModal";
import { DecisionLog } from "@/components/dashboard/DecisionLog";
import { LeftRail } from "@/components/dashboard/LeftRail";
import { StudioTaskSpoilers } from "@/components/dashboard/StudioTaskSpoilers";
import type { SimTabId } from "@/lib/site";

const ArenaApp = dynamic(() => import("@/components/simulation/ArenaApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#07080b]">
      <p className="text-sm text-arena-muted">Loading physics…</p>
    </div>
  ),
});

/**
 * Full-bleed studio canvas with glass overlays. Physics stays in ArenaApp.
 *
 * @example <SimulationDashboard />
 */
export function SimulationDashboard() {
  const [tab, setTab] = useState<SimTabId>("vision");

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden bg-[#07080b] max-md:h-[calc(100dvh-6.75rem)]">
      <ClipExportModal />
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <ArenaApp />
        </div>
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-3 md:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="pointer-events-auto flex flex-col gap-2">
              <ArenaStatus />
              <StudioTaskSpoilers />
            </div>
            <div className="pointer-events-auto hidden md:block">
              <DecisionLog />
            </div>
          </div>
          <div className="mt-3 hidden min-h-0 max-w-[16.5rem] flex-1 overflow-y-auto lg:block">
            <div className="pointer-events-auto">
              <LeftRail tab={tab} />
            </div>
          </div>
          <div className="pointer-events-auto mt-auto pt-3">
            <ArenaDock tab={tab} onTab={setTab} />
          </div>
        </div>
      </div>
    </div>
  );
}
