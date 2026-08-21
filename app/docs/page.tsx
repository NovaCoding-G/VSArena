import { DocsContent } from "@/components/docs/DocsContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Docs",
  "SDK quickstart, VLA vs state tracks, how public ELO is written, and the WebSocket protocol.",
  "/docs",
);

/**
 * Product docs: one page, sticky TOC, copy-paste snippets.
 *
 * @example routed at /docs
 */
export default function DocsPage() {
  return <DocsContent />;
}
