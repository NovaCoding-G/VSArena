"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/LocaleProvider";

const STILLS = [
  { id: "studio" as const, href: "/simulation", visual: "scene" as const },
  { id: "cam" as const, href: "/docs#tracks", visual: "cam" as const },
  { id: "elo" as const, href: "/leaderboard", visual: "elo" as const },
];

/**
 * Three stills so the home page is not only a headline.
 *
 * @example <LandingStills />
 */
export function LandingStills() {
  const { m } = useI18n();
  const copy = {
    studio: { title: m.landing.stillStudioTitle, body: m.landing.stillStudioBody },
    cam: { title: m.landing.stillCamTitle, body: m.landing.stillCamBody },
    elo: { title: m.landing.stillEloTitle, body: m.landing.stillEloBody },
  };

  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-3">
      {STILLS.map((item) => (
        <Link key={item.id} href={item.href} className="panel group p-4 transition-colors hover:border-white/15">
          <Still visual={item.visual} seed={m.landing.stillSeed} />
          <p className="mt-3 text-sm font-medium text-white">{copy[item.id].title}</p>
          <p className="mt-1 text-xs leading-5 text-arena-muted">{copy[item.id].body}</p>
        </Link>
      ))}
    </div>
  );
}

function Still({ visual, seed }: { visual: (typeof STILLS)[number]["visual"]; seed: string }) {
  if (visual === "cam") {
    return (
      <div className="flex h-16 items-center justify-center rounded-xl bg-black/50">
        <div className="grid grid-cols-8 gap-px">
          {Array.from({ length: 32 }, (_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-[1px]"
              style={{
                background: i % 7 === 0 ? "#00AEEF" : i % 5 === 0 ? "#F7941E" : i % 11 === 0 ? "#E11D8F" : "#1a222c",
              }}
            />
          ))}
        </div>
      </div>
    );
  }
  if (visual === "elo") {
    return (
      <div className="flex h-16 flex-col justify-center rounded-xl bg-black/50 px-3 font-mono text-[11px]">
        <p className="flex justify-between text-arena-muted">
          <span>1 Baseline-IK</span>
          <span className="text-white">1200</span>
        </p>
        <p className="mt-1 text-arena-orange">{seed}</p>
      </div>
    );
  }
  return (
    <div className="flex h-16 items-end justify-center rounded-xl bg-black/50 pb-3">
      <span className="h-8 w-2 rounded-sm bg-arena-cyan/80" />
      <span className="mb-2 ml-1 h-5 w-8 rounded-sm bg-arena-cyan" />
      <span className="ml-3 h-3 w-3 rounded-sm bg-arena-cyan" />
      <span className="ml-1 h-3 w-3 rounded-sm bg-arena-orange" />
      <span className="ml-1 h-3 w-3 rounded-sm bg-[#E11D8F]" />
    </div>
  );
}
