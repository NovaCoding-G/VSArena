/** Slugs that were Week-3 name-drops, not executed policies. Hidden from the public board. */

export const PLACEHOLDER_AGENT_SLUGS = new Set(["smolvla", "openvla-micro"]);

/**
 * True when this agent may appear on the public ELO table.
 *
 * @example isPublicLeaderboardAgent("baseline-ik") // true
 */
export function isPublicLeaderboardAgent(slug: string): boolean {
  return !PLACEHOLDER_AGENT_SLUGS.has(slug);
}
