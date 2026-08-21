import Link from "next/link";

export const dynamic = "force-dynamic";

const REASONS: Record<string, string> = {
  config: "Supabase keys are missing. Fill .env.local and restart the dev server.",
  oauth: "GitHub OAuth is not enabled. In Supabase: Authentication → Providers → GitHub.",
  code: "OAuth callback missed the authorization code.",
  session: "Could not exchange the GitHub code for a session. Check redirect URLs.",
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const reason = searchParams.reason ?? "";
  const message = REASONS[reason] ?? "Sign-in failed. Try again from the header.";

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-20">
      <p className="text-sm font-medium text-arena-orange">Authentication</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Sign-in failed</h1>
      <p className="mt-4 text-sm leading-6 text-arena-muted">{message}</p>
      <p className="mt-4 text-sm leading-6 text-arena-muted">
        Allow redirect: <code className="text-white">http://localhost:3000/auth/callback</code>
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-arena-cyan hover:text-white">
        ← Home
      </Link>
    </main>
  );
}
