// Counting the League's statement of the alleged breaches, rule by season.
import type { AllegationGroup, AllegationSeason } from "./types";

const RANGE = /^[A-Z]\.(\d+) to [A-Z]\.(\d+)$/;

// One rule counts once. A range such as "E.52 to E.60" counts every rule in it.
export function ruleCount(rule: string): number {
  const range = rule.match(RANGE);
  return range ? Number(range[2]) - Number(range[1]) + 1 : 1;
}

export function seasonCount(season: AllegationSeason): number {
  return season.rules.reduce((sum, rule) => sum + ruleCount(rule), 0);
}

export function groupCount(group: AllegationGroup): number {
  return group.seasons.reduce((sum, season) => sum + seasonCount(season), 0);
}

// Every season any group cites, in order: the columns of the grid.
export function seasonsCited(groups: AllegationGroup[]): string[] {
  return [...new Set(groups.flatMap((group) => group.seasons.map((s) => s.season)))].sort();
}
