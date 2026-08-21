import { LegalView } from "@/components/legal/LegalView";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Terms",
  "Termini di utilizzo del servizio VSArena: account, classifica, responsabilità, legge italiana.",
  "/terms",
);

export default function TermsPage() {
  return <LegalView kind="terms" />;
}
