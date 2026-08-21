"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { chromeLink } from "@/lib/i18n/messages";
import { FOOTER } from "@/lib/site";

export function SiteFooter() {
  const { m } = useI18n();

  return (
    <footer className="mt-auto shrink-0 border-t border-white/[0.06]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark decorative className="h-8 w-auto" width={100} height={70} />
            <span className="text-sm font-semibold text-white">VSArena</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-arena-muted">{m.footer.tagline}</p>
        </div>
        <FooterCol title={m.footer.product} links={FOOTER.product} />
        <FooterCol title={m.footer.company} links={FOOTER.company} />
        <FooterCol title={m.footer.developers} links={FOOTER.developers} />
        <FooterCol title={m.footer.legal} links={FOOTER.legal} />
      </div>
      <div className="border-t border-white/[0.06]">
        <p className="mx-auto max-w-6xl px-5 py-6 text-sm text-arena-muted">
          © {new Date().getFullYear()} VSArena · {m.footer.copy}
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; key: string }[];
}) {
  const { m } = useI18n();
  return (
    <div>
      <p className="text-sm font-medium text-white">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-sm text-arena-muted hover:text-white">
              {chromeLink(m, item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
