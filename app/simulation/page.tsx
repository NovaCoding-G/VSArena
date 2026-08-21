import { SimulationDashboard } from "@/components/dashboard/SimulationDashboard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Studio v0.1",
  "Live stacking work-cell. Spectate, teleop, or run ColorSeek. Public ELO is harness-only.",
  "/simulation",
);

export default function SimulationPage() {
  return <SimulationDashboard />;
}
