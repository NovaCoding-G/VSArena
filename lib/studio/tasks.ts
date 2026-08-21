/** Upcoming Studio tasks. Only block stacking is live in the MVP. */

export const STUDIO_TASKS = [
  { id: "block_stacking", live: true, nameKey: "stackingName" },
  { id: "color_sort", live: false, nameKey: "sortName", spoilerKey: "sortSpoiler" },
  { id: "peg_in_hole", live: false, nameKey: "pegName", spoilerKey: "pegSpoiler" },
  { id: "push_to_zone", live: false, nameKey: "pushName", spoilerKey: "pushSpoiler" },
] as const;

export type StudioTaskId = (typeof STUDIO_TASKS)[number]["id"];
