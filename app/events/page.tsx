import { ComingSoon } from "@/components/layout/ComingSoon";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Events",
  "Coming soon: cups and live broadcasts. None scheduled.",
  "/events",
);

export default function EventsPage() {
  return <ComingSoon section="events" />;
}
