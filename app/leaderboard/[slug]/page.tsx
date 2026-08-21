import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentDetailView } from "@/components/dashboard/AgentDetailView";
import { getAgent, listMatchesForAgent } from "@/lib/matches/store";
import { pageMetadata } from "@/lib/seo";
import { dict, fill } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

interface AgentPageProps {
  params: { slug: string };
}

/**
 * Per-agent OG title so a tweeted run unfurls with the policy name.
 *
 * @example generateMetadata({ params: { slug: "baseline-ik" } })
 */
export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const agent = await getAgent(params.slug);
  const b = dict(getRequestLocale()).board;
  if (!agent) return pageMetadata(b.agentKicker, b.metaDesc, `/leaderboard/${params.slug}`);
  return pageMetadata(
    agent.name,
    fill(b.agentMeta, { elo: agent.elo, n: agent.matches }),
    `/leaderboard/${agent.slug}`,
  );
}

export default async function AgentPage({ params }: AgentPageProps) {
  const agent = await getAgent(params.slug);
  if (!agent) notFound();
  const history = await listMatchesForAgent(agent.slug);
  return <AgentDetailView agent={agent} history={history} />;
}
