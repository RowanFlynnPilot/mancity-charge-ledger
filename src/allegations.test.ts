import { expect, test } from "vitest";
import allegationsJson from "../data/allegations.json";
import { groupCount, ruleCount, seasonCount, seasonsCited } from "./allegations";
import type { Allegations } from "./types";

const allegations = allegationsJson as Allegations;

test("a single rule counts once, a range counts every rule in it", () => {
  expect(ruleCount("B.13")).toBe(1);
  expect(ruleCount("B.14.6")).toBe(1);
  expect(ruleCount("E.52 to E.60")).toBe(9);
  expect(ruleCount("E.53 to E.60")).toBe(8);
});

test("a season counts each rule it cites", () => {
  expect(seasonCount({ season: "2015/16", rules: ["E.52 to E.60"], note: null })).toBe(9);
  expect(seasonCount({ season: "2013/14", rules: ["B.15", "E.3", "E.4", "E.11", "E.12", "E.49"], note: null })).toBe(6);
});

// The published count. If the data changes, this is the number the page will show.
test("the League's statement comes to 130 counted rule by season", () => {
  expect(allegations.groups.map((group) => [group.id, groupCount(group)])).toEqual([
    ["financial-information", 50],
    ["manager-remuneration", 8],
    ["player-remuneration", 12],
    ["uefa-regulations", 5],
    ["profitability-and-sustainability", 25],
    ["cooperation", 30],
  ]);
  expect(allegations.groups.reduce((sum, group) => sum + groupCount(group), 0)).toBe(130);
});

test("the statement spans fourteen seasons", () => {
  const seasons = seasonsCited(allegations.groups);
  expect(seasons).toHaveLength(14);
  expect([seasons[0], seasons[13]]).toEqual(["2009/10", "2022/23"]);
});
