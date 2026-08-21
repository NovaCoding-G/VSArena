"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { BrandMark } from "@/components/brand/BrandMark";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import { MAIN_NAV } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Product nav. Studio is live; Arena / Community are coming soon. */
export function SiteHeader() {
  const pathname = usePathname();
  const { m } = useI18n();

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-white/[0.06] bg-[#07080b]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-5 px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandMark className="h-9 w-auto" width={140} height={96} priority />
          <span className="text-[15px] font-semibold tracking-tight text-white">VSArena</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {MAIN_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const soon = "soon" in item && item.soon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-sm transition-colors lg:px-3",
                  active ? "bg-white/10 text-white" : "text-arena-muted hover:text-white",
                )}
              >
                {m.nav[item.key]}
                {soon ? <span className="ml-1.5 text-[10px] text-arena-muted">{m.nav.soon}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/simulation">{m.nav.openStudio}</Link>
          </Button>
          <AuthButton />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/[0.06] px-4 py-2 md:hidden">
        {MAIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full px-3 py-1 text-sm text-arena-muted"
          >
            {m.nav[item.key]}
          </Link>
        ))}
      </nav>
    </header>
  );
}
