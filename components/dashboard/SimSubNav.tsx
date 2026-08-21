"use client";

import { cn } from "@/lib/utils";
import { SIM_TABS, type SimTabId } from "@/lib/site";

interface SimSubNavProps {
  value: SimTabId;
  onChange: (id: SimTabId) => void;
}

export function SimSubNav({ value, onChange }: SimSubNavProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {SIM_TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              active ? "bg-white text-zinc-950" : "text-arena-muted hover:bg-white/5 hover:text-white",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
