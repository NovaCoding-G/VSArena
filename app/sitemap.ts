import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PATHS = [
  "/",
  "/simulation",
  "/arena",
  "/leaderboard",
  "/docs",
  "/submit",
  "/about",
  "/community",
  "/events",
  "/terms",
  "/privacy",
] as const;

/**
 * Static public URLs for crawlers. Agent detail pages stay off the map until they have traffic.
 *
 * @example GET /sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  return PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/leaderboard" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
