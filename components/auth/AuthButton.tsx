"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/**
 * GitHub OAuth control for the site header.
 *
 * @example <AuthButton />
 */
export function AuthButton() {
  const { m } = useI18n();
  const [label, setLabel] = useState<string | null>(null);
  const pathname = usePathname();
  const enabled = isSupabaseConfigured();

  useEffect(() => {
    if (!enabled) return;
    const supabase = createBrowserSupabase();
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const name = data.user?.user_metadata?.user_name ?? data.user?.email ?? null;
      setLabel(typeof name === "string" ? name : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const name = session?.user?.user_metadata?.user_name ?? session?.user?.email ?? null;
      setLabel(typeof name === "string" ? name : null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [enabled]);

  if (!enabled) return null;

  if (label) {
    return (
      <form action="/auth/logout" method="post" className="flex items-center gap-3">
        <Link href="/account" className="max-w-[10rem] truncate text-sm text-white hover:text-arena-cyan">
          {label}
        </Link>
        <button type="submit" className="text-sm text-arena-muted hover:text-white">
          {m.nav.signOut}
        </button>
      </form>
    );
  }

  async function signIn() {
    const next = pathname.startsWith("/auth") ? "/" : pathname || "/";
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) window.location.href = "/auth/error?reason=oauth";
    } catch {
      window.location.href = "/auth/error?reason=oauth";
    }
  }

  return (
    <button
      type="button"
      onClick={() => void signIn()}
      className="rounded-full px-3 py-1.5 text-sm text-arena-muted hover:bg-white/5 hover:text-white"
    >
      {m.nav.signIn}
    </button>
  );
}
