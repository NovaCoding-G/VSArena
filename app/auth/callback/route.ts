import { handleAuthCallback } from "@/lib/supabase/callback";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleAuthCallback(request);
}
