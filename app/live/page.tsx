import { LiveViewer } from "@/components/live/LiveViewer";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Live",
  "Watch the official VSArena harness judge a live match in real time. Read-only — ELO stays on the server.",
  "/live",
);

/**
 * Public spectator for the hosted harness (/spectate).
 *
 * @example routed at /live
 */
export default function LivePage() {
  return (
    <main className="flex-1">
      <LiveViewer />
    </main>
  );
}
