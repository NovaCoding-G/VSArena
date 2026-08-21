import { handleAuthCallback } from "@/lib/supabase/callback";

export const dynamic = "force-dynamic";

/** Alias: GitHub/Supabase sometimes land on /auth/v1/callback instead of /auth/callback. */
export async function GET(request: Request) {
  return handleAuthCallback(request);
}
