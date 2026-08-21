"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Global chrome. Simulation is full-height; other pages keep a footer.
 *
 * @example <SiteChrome>{children}</SiteChrome>
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const sim = path.startsWith("/simulation");

  return (
    <>
      <SiteHeader />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {sim ? null : <SiteFooter />}
    </>
  );
}
