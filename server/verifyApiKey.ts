/** Lookup `profiles.api_key` via service role. Dev fallback: accept if Supabase is missing. */

import { createAdminSupabase } from "../lib/supabase/admin";
import { hasServiceRole } from "../lib/supabase/env";

export interface ApiKeyOk {
  ok: true;
  username: string;
}

export interface ApiKeyBad {
  ok: false;
  reason: string;
}

/**
 * Validate a harness hello key against Postgres.
 *
 * @example const check = await verifyHarnessApiKey(hello.api_key)
 */
export async function verifyHarnessApiKey(apiKey: string): Promise<ApiKeyOk | ApiKeyBad> {
  const trimmed = apiKey.trim();
  if (!trimmed) return { ok: false, reason: "api_key required" };
  if (!hasServiceRole()) {
    console.warn("[vsarena-harness] no SUPABASE_SERVICE_ROLE_KEY — accepting any api_key (dev only)");
    return { ok: true, username: "dev" };
  }
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("profiles")
    .select("username")
    .eq("api_key", trimmed)
    .maybeSingle();
  if (error) {
    console.error("[vsarena-harness] api_key lookup failed", error.message);
    return { ok: false, reason: "api_key lookup failed" };
  }
  if (!data?.username) return { ok: false, reason: "invalid api_key" };
  return { ok: true, username: String(data.username) };
}
