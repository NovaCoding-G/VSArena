import type { ReactNode } from "react";

interface PageFrameProps {
  kicker?: string;
  title: string;
  children: ReactNode;
}

/**
 * Editorial inner-page layout.
 *
 * @example <PageFrame title="Leaderboard">…</PageFrame>
 */
export function PageFrame({ kicker, title, children }: PageFrameProps) {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-5xl px-5 py-16 md:py-20">
        {kicker ? <p className="text-sm font-medium text-arena-cyan">{kicker}</p> : null}
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">{title}</h1>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
