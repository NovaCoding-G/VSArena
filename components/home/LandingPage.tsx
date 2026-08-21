"use client";

import Link from "next/link";
import { ArenaBackdrop } from "@/components/brand/ArenaBackdrop";
import { BrandMark } from "@/components/brand/BrandMark";
import { LandingHeroPreview } from "@/components/home/LandingHeroPreview";
import { LandingReveal } from "@/components/home/LandingReveal";
import { LandingStills } from "@/components/home/LandingStills";
import { LandingTrust } from "@/components/home/LandingTrust";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import { TEAM } from "@/lib/content";

interface LandingPageProps {
  agentCount: number;
}

/**
 * Company home: why it exists, what it is, how to use it.
 *
 * @example <LandingPage agentCount={1} />
 */
export function LandingPage({ agentCount }: LandingPageProps) {
  const { m } = useI18n();
  const pillars = [
    { title: m.landing.pillar1Title, body: m.landing.pillar1Body },
    { title: m.landing.pillar2Title, body: m.landing.pillar2Body },
    { title: m.landing.pillar3Title, body: m.landing.pillar3Body },
  ];
  const how = [
    { n: "01", title: m.landing.how1Title, body: m.landing.how1Body },
    { n: "02", title: m.landing.how2Title, body: m.landing.how2Body },
    { n: "03", title: m.landing.how3Title, body: m.landing.how3Body },
  ];

  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden">
        <ArenaBackdrop />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-12 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-16 lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-arena-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-arena-cyan" />
              {m.landing.kicker}
            </p>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
              {m.landing.h1}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-arena-muted sm:text-lg">{m.landing.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/simulation">{m.landing.ctaStudio}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/submit">{m.landing.ctaSubmit}</Link>
              </Button>
            </div>
          </div>

          <LandingHeroPreview />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 lg:pb-20">
          <LandingStills />
        </div>
      </section>

      <LandingTrust agentCount={agentCount} />

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:py-24">
          <LandingReveal>
            <p className="text-sm font-medium text-arena-cyan">{m.landing.whyKicker}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{m.landing.whyH2}</h2>
          </LandingReveal>
          <LandingReveal delayMs={80}>
            <div className="space-y-4 text-base leading-7 text-arena-muted">
              <p>{m.landing.whyP1}</p>
              <p>{m.landing.whyP2}</p>
            </div>
          </LandingReveal>
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-24">
          <LandingReveal>
            <p className="text-sm font-medium text-arena-cyan">{m.landing.whatKicker}</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white">{m.landing.whatH2}</h2>
          </LandingReveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {pillars.map((item, index) => (
              <LandingReveal key={item.title} delayMs={index * 70}>
                <p className="text-sm font-medium text-arena-cyan">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-arena-muted">{item.body}</p>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-24">
          <LandingReveal>
            <p className="text-sm font-medium text-arena-cyan">{m.landing.howKicker}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{m.landing.howH2}</h2>
          </LandingReveal>
          <ol className="mt-12 grid list-none gap-6 p-0 md:grid-cols-3">
            {how.map((step, index) => (
              <li key={step.n}>
                <LandingReveal delayMs={index * 70}>
                  <article className="panel h-full p-6">
                    <p className="text-sm font-medium text-arena-orange">{step.n}</p>
                    <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-arena-muted">{step.body}</p>
                  </article>
                </LandingReveal>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-2xl text-sm leading-6 text-arena-muted">{m.landing.howNote}</p>
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <LandingReveal>
            <p className="text-sm font-medium text-arena-cyan">{m.landing.teamKicker}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{m.landing.teamH2}</h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-arena-muted">{m.landing.teamBody}</p>
            <Link href="/about#team" className="mt-6 inline-block text-sm text-arena-cyan hover:text-white">
              {m.landing.teamLink}
            </Link>
          </LandingReveal>
          <LandingReveal delayMs={80}>
            <article className="panel flex items-center gap-5 p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <BrandMark decorative width={80} height={60} className="h-12 w-auto" />
              </div>
              <div>
                <p className="font-semibold text-white">{TEAM[0].name}</p>
                <p className="mt-0.5 text-sm text-arena-cyan">{m.landing.teamRole}</p>
                <p className="mt-2 text-sm leading-6 text-arena-muted">{m.landing.teamBio}</p>
              </div>
            </article>
          </LandingReveal>
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-5 py-20 md:flex-row md:items-center md:py-24">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white">{m.landing.ctaH2}</h2>
            <p className="mt-2 max-w-md text-arena-muted">{m.landing.ctaBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/simulation">{m.landing.ctaStudio}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs">{m.landing.ctaDocs}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
