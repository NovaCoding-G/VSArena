"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { Badge } from "@/components/ui/badge";
import { STUDIO_TASKS } from "@/lib/studio/tasks";
import { cn } from "@/lib/utils";

/**
 * Live stacking plus coming-soon spoilers. No physics switch — other tasks are not built.
 *
 * @example <StudioTaskSpoilers />
 */
export function StudioTaskSpoilers() {
  const { m } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = STUDIO_TASKS.find((task) => task.id === openId && !task.live);

  return (
    <div className="panel max-w-[20rem] space-y-2 p-2 backdrop-blur-xl">
      <div className="flex flex-wrap gap-1.5">
        {STUDIO_TASKS.map((task) => {
          const label = m.studio[task.nameKey];
          const selected = task.live || openId === task.id;
          return (
            <button
              key={task.id}
              type="button"
              disabled={task.live}
              onClick={() => setOpenId((id) => (id === task.id ? null : task.id))}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-[11px]",
                task.live
                  ? "cursor-default border-arena-cyan/40 bg-arena-cyan/10 text-white"
                  : selected
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 text-arena-muted hover:border-white/20 hover:text-white",
              )}
            >
              {label}
              <Badge variant={task.live ? "cyan" : "orange"} className="px-1.5 py-0 text-[9px]">
                {task.live ? m.studio.live : m.studio.soon}
              </Badge>
            </button>
          );
        })}
      </div>
      {open && "spoilerKey" in open ? (
        <p className="px-1 pb-1 text-xs leading-5 text-arena-muted">{m.studio[open.spoilerKey]}</p>
      ) : null}
    </div>
  );
}
