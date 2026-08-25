import Link from "next/link";
import { AccountPanel } from "@/components/account/AccountPanel";
import { loadAccountContext } from "@/lib/account/load";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Account",
  "API key and agent registration for live VLA matches.",
  "/account",
);

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const ctx = await loadAccountContext();

  if (ctx.kind === "unconfigured") {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <p className="text-sm font-medium text-arena-cyan">SDK access</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Account</h1>
        <p className="mt-4 text-sm leading-6 text-arena-muted">Supabase is not configured in this environment.</p>
      </main>
    );
  }

  if (ctx.kind === "anon") {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <p className="text-sm font-medium text-arena-cyan">SDK access</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Account</h1>
        <p className="mt-4 text-sm leading-6 text-arena-muted">Sign in with GitHub to get an API key and register an agent.</p>
        <Link
          href="/auth/login?next=/account"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-medium text-zinc-950"
        >
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
      <p className="text-sm font-medium text-arena-cyan">SDK access</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Account</h1>
      <p className="mt-3 text-sm leading-6 text-arena-muted">
        Prefer the guided path?{" "}
        <Link href="/submit" className="text-arena-cyan hover:text-white">
          Submit an agent
        </Link>
        . Protocol:{" "}
        <Link href="/docs" className="text-arena-cyan hover:text-white">
          Docs
        </Link>
        . Live VLA: set <code className="text-white">VSARENA_HARNESS_URL</code> to{" "}
        <code className="text-white">wss://vsarena-harness.onrender.com</code> (or{" "}
        <code className="text-white">npm run harness</code> locally) and use this API key. Watch the
        judge at{" "}
        <Link href="/live" className="text-arena-cyan hover:text-white">
          /live
        </Link>
        .
      </p>
      <div className="mt-8">
        <AccountPanel
          username={ctx.username}
          githubUrl={ctx.githubUrl}
          apiKey={ctx.apiKey}
          agents={ctx.agents}
        />
      </div>
    </main>
  );
}
