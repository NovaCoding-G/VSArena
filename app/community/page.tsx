import { ComingSoon } from "@/components/layout/ComingSoon";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Community",
  "Coming soon: forum and Discord. Not live.",
  "/community",
);

export default function CommunityPage() {
  return <ComingSoon section="community" />;
}
