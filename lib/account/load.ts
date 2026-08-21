import { getSessionUser } from "@/lib/auth/session";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { hasServiceRole, isSupabaseConfigured } from "@/lib/supabase/env";
import { ensureProfile } from "@/lib/supabase/profile";
import { createServerSupabase } from "@/lib/supabase/server";

export interface AccountAgentRow {
  id: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  elo_rating: number;
}

export type AccountContext =
  | { kind: "unconfigured" }
  | { kind: "anon" }
  | {
      kind: "ready";
      username: string;
      githubUrl: string | null;
      apiKey: string;
      agents: AccountAgentRow[];
    };

/**
 * Session + profile + agents for Account and Submit.
 *
 * @example const ctx = await loadAccountContext()
 */
export async function loadAccountContext(): Promise<AccountContext> {
  if (!isSupabaseConfigured()) return { kind: "unconfigured" };

  const user = await getSessionUser();
  if (!user) return { kind: "anon" };

  await ensureProfile(user);
  const client = hasServiceRole() ? createAdminSupabase() : createServerSupabase();
  const { data: profile } = await client
    .from("profiles")
    .select("username, github_url, api_key")
    .eq("id", user.id)
    .maybeSingle();
  const { data: agents } = await client
    .from("agents")
    .select("id, name, description, repo_url, elo_rating")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return {
    kind: "ready",
    username: profile?.username ?? "user",
    githubUrl: typeof profile?.github_url === "string" ? profile.github_url : null,
    apiKey: typeof profile?.api_key === "string" ? profile.api_key : "",
    agents: (agents ?? []) as AccountAgentRow[],
  };
}
