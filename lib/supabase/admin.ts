import { createClient } from "@supabase/supabase-js";
import { hasServiceRole, supabaseServiceRoleKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Service-role client. Server-only — bypasses RLS. Never import from client components.
 *
 * @example const admin = createAdminSupabase()
 */
export function createAdminSupabase() {
  if (!hasServiceRole()) {
    throw new Error("Supabase service role is not configured");
  }
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
