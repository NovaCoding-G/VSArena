import { LegalView } from "@/components/legal/LegalView";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Privacy",
  "Informativa GDPR: account GitHub, classifica pubblica, cookie tecnici, diritti dell’interessato.",
  "/privacy",
);

export default function PrivacyPage() {
  return <LegalView kind="privacy" />;
}
