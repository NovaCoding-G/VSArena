import { LandingPage } from "@/components/home/LandingPage";
import { listLeaderboard } from "@/lib/matches/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await listLeaderboard();
  return <LandingPage agentCount={rows.length} />;
}
