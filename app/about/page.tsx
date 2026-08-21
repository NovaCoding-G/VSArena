import { AboutContent } from "@/components/about/AboutContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "About",
  "VSArena is a public stacking work-cell for embodied policies. Studio is live. 1v1 Arena is not.",
  "/about",
);

export default function AboutPage() {
  return <AboutContent />;
}
