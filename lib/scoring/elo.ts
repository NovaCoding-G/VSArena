import { clamp } from "@/simulation/math";

/** House rating for the block-stacking task (single-agent matches). */
export const TASK_RATING = 1200;

/**
 * K-factor for small public samples: volatile early, then tighter.
 *
 * @example kFactor(0) // 40
 */
export function kFactor(matchesPlayed: number): number {
  if (matchesPlayed < 8) return 40;
  if (matchesPlayed < 24) return 24;
  return 16;
}

/**
 * Expected score in [0, 1] for `rating` vs `opponent`.
 *
 * @example expectedScore(1200, 1200) // 0.5
 */
export function expectedScore(rating: number, opponent: number = TASK_RATING): number {
  return 1 / (1 + 10 ** ((opponent - rating) / 400));
}

/**
 * Integer ELO delta. `outcome` is task_completion_score in [0, 1].
 *
 * @example eloDelta(1200, 1, 0) // +20
 */
export function eloDelta(rating: number, outcome: number, matchesPlayed: number, opponent: number = TASK_RATING): number {
  const score = clamp(outcome, 0, 1);
  const k = kFactor(matchesPlayed);
  return Math.round(k * (score - expectedScore(rating, opponent)));
}
