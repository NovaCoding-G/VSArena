"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { PageFrame } from "@/components/layout/PageFrame";
import { GITHUB_ORG, TEAM } from "@/lib/content";

/**
 * About copy, localized.
 *
 * @example <AboutContent />
 */
export function AboutContent() {
  const { m } = useI18n();
  const a = m.about;
  const cards = [
    { title: a.studioTitle, body: a.studioBody },
    { title: a.trackTitle, body: a.trackBody },
    { title: a.boardTitle, body: a.boardBody },
    { title: a.notTitle, body: a.notBody },
  ];
  const rules = [
    { title: a.rule1Title, body: a.rule1Body },
    { title: a.rule2Title, body: a.rule2Body },
    { title: a.rule3Title, body: a.rule3Body },
  ];

  return (
    <PageFrame kicker={a.kicker} title={a.title}>
      <p className="-mt-2 max-w-2xl text-lg leading-8 text-arena-muted">{a.lead}</p>

      <section className="mt-16 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-arena-cyan">{a.originKicker}</h2>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{a.originH3}</h3>
        </div>
        <div className="space-y-4 text-base leading-7 text-arena-muted">
          <p>{a.originP1}</p>
          <p>{a.originP2}</p>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-sm font-medium text-arena-cyan">{a.whatKicker}</h2>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{a.whatH3}</h3>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {cards.map((item) => (
            <article key={item.title} className="panel p-6">
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-arena-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="team" className="mt-20 scroll-mt-24">
        <h2 className="text-sm font-medium text-arena-cyan">{a.teamKicker}</h2>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{a.teamH3}</h3>
        <p className="mt-4 max-w-2xl text-base leading-7 text-arena-muted">{a.teamLead}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {TEAM.map((person) => (
            <article key={person.name} className="panel flex gap-5 p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <BrandMark decorative width={80} height={60} className="h-12 w-auto" />
              </div>
              <div>
                <p className="font-semibold text-white">{person.name}</p>
                <p className="mt-0.5 text-sm text-arena-cyan">{m.landing.teamRole}</p>
                <p className="mt-2 text-sm leading-6 text-arena-muted">{m.landing.teamBio}</p>
                <a
                  href={person.href}
                  className="mt-3 inline-block text-sm text-white hover:text-arena-cyan"
                  target="_blank"
                  rel="noreferrer"
                >
                  {a.github}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-sm font-medium text-arena-cyan">{a.rulesKicker}</h2>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{a.rulesH3}</h3>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {rules.map((item) => (
            <article key={item.title} className="panel p-6">
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-arena-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="sdk" className="panel mt-20 scroll-mt-24 p-6">
        <h2 className="text-lg font-semibold text-white">{a.sdkTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-arena-muted">
          <code className="text-white">pip install -e sdk/python</code> {a.sdkBody}{" "}
          <code className="text-white">python -m vsarena</code>.{" "}
          <Link className="text-arena-cyan hover:text-white" href="/docs#quickstart">
            {m.nav.docs}
          </Link>
          .
        </p>
      </section>
      <section id="docs" className="panel mt-4 scroll-mt-24 p-6">
        <h2 className="text-lg font-semibold text-white">{a.protocolTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-arena-muted">
          {a.protocolBody}{" "}
          <Link className="text-arena-cyan hover:text-white" href="/docs#protocol">
            {m.nav.docs}
          </Link>
          .
        </p>
      </section>
      <section id="submit" className="panel mt-4 scroll-mt-24 p-6">
        <h2 className="text-lg font-semibold text-white">{a.submitTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-arena-muted">
          {a.submitBody} <code className="text-white">Agent.act</code>.{" "}
          <Link className="text-arena-cyan hover:text-white" href="/submit">
            {a.submitLink}
          </Link>
          .
        </p>
      </section>
      <section id="careers" className="panel mt-4 scroll-mt-24 p-6">
        <h2 className="text-lg font-semibold text-white">{a.jobsTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-arena-muted">
          {a.jobsBody}{" "}
          <a href={GITHUB_ORG} className="text-arena-cyan hover:text-white" target="_blank" rel="noreferrer">
            GitHub
          </a>
          .
        </p>
      </section>
      <section id="terms" className="panel mt-4 scroll-mt-24 p-6">
        <h2 className="text-lg font-semibold text-white">{a.termsTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-arena-muted">
          {a.termsBody}{" "}
          <Link className="text-arena-cyan hover:text-white" href="/terms">
            {a.termsLink}
          </Link>
          .
        </p>
      </section>
      <section id="privacy" className="panel mt-4 scroll-mt-24 p-6">
        <h2 className="text-lg font-semibold text-white">{a.privacyTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-arena-muted">
          {a.privacyBody}{" "}
          <Link className="text-arena-cyan hover:text-white" href="/privacy">
            {a.privacyLink}
          </Link>
          .
        </p>
      </section>
    </PageFrame>
  );
}
