import { SubmitGuide } from "@/components/submit/SubmitGuide";
import { loadAccountContext } from "@/lib/account/load";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Submit an agent",
  "Beginner walkthrough or researcher protocol. Sign in, implement Agent.act, run a VLA match.",
  "/submit",
);

export const dynamic = "force-dynamic";

/**
 * Agent submission. Two guides share the same account controls.
 *
 * @example routed at /submit
 */
export default async function SubmitPage({
  searchParams,
}: {
  searchParams: { guide?: string };
}) {
  const ctx = await loadAccountContext();
  const initialAudience = searchParams.guide === "researcher" ? "researcher" : "beginner";

  return (
    <main className="flex-1">
      <SubmitGuide ctx={ctx} initialAudience={initialAudience} />
    </main>
  );
}
