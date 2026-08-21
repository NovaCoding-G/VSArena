import type { User } from "@supabase/supabase-js";
import { createAdminSupabase } from "@/lib/supabase/admin";

/**
 * GitHub handle from Auth metadata, with a stable fallback.
 *
 * @example githubUsername(user) // "NovaCoding-G"
 */
export function githubUsername(user: User): string {
  const meta = user.user_metadata ?? {};
  const raw = meta.user_name ?? meta.preferred_username ?? meta.login ?? user.email?.split("@")[0];
  const handle = String(raw ?? "user")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
  return handle || `user-${user.id.slice(0, 8)}`;
}

/**
 * Insert a profiles row for a newly signed-in user (idempotent).
 *
 * @example await ensureProfile(user)
 */
export async function ensureProfile(user: User): Promise<void> {
  const admin = createAdminSupabase();
  const username = githubUsername(user);
  const githubUrl = `https://github.com/${username}`;
  const { data: existing, error: readError } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (readError) throw readError;
  if (existing) return;

  const { error } = await admin.from("profiles").insert({
    id: user.id,
    username,
    github_url: githubUrl,
  });
  if (error?.code === "23505") {
    return;
  }
  if (error) throw error;
}
