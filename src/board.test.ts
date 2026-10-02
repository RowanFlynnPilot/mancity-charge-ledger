import { expect, test } from "vitest";
import { groupByNumber, money, shortRef, total } from "./board";
import { funding } from "./data";
import type { Charge, FundingSeason } from "./types";

const charge = (id: string, ref: string): Charge => ({
  id, ref, caseId: "pl-2023", subject: "", period: null, finding: "proven", appeal: "none", summary: "", sources: [],
});

test("groups charges by the Commission's charge number, keeping their order", () => {
  const charges = [
    charge("1A", "Charge 1(A)"), charge("1B", "Charge 1(B)"), charge("2", "Charge 2"),
    charge("3", "Charge 3"), charge("4A", "Charge 4(A)"), charge("4B", "Charge 4(B)"),
  ];
  expect(groupByNumber(charges).map((group) => group.map((c) => c.id)))
    .toEqual([["1A", "1B"], ["2"], ["3"], ["4A", "4B"]]);
});

test("a two-digit charge number is one group", () => {
  const groups = groupByNumber([charge("1A", "Charge 1(A)"), charge("10A", "Charge 10(A)"), charge("10B", "Charge 10(B)")]);
  expect(groups.map((group) => group.length)).toEqual([1, 2]);
});

test("drops the word from a charge reference", () => {
  expect(shortRef(charge("1A", "Charge 1(A)"))).toBe("1(A)");
  expect(shortRef(charge("2", "Charge 2"))).toBe("2");
});

test("totals come out to the penny despite floating point", () => {
  const seasons: FundingSeason[] = [
    { season: "2014/15", recorded: 123.2, paidBySponsors: 16.0, paidByOwner: 107.2 },
    { season: "2015/16", recorded: 136.17, paidBySponsors: 16.0, paidByOwner: 120.17 },
    { season: "2016/17", recorded: 140.59, paidBySponsors: 11.0, paidByOwner: 129.59 },
  ];
  expect(money(total(seasons, "recorded"))).toBe("399.96");
  expect(money(total(seasons, "paidByOwner"))).toBe("356.96");
  expect(money(4.5)).toBe("4.50");
});

// The published totals. The validator checks that each season's two parts add
// up, which a slip in one season's figures can still pass. The decision states
// these three totals itself, at paragraph 72.
test("the funding figures come to the totals the decision states", () => {
  expect(funding.seasons).toHaveLength(9);
  expect(money(total(funding.seasons, "recorded"))).toBe("949.94");
  expect(money(total(funding.seasons, "paidBySponsors"))).toBe("119.25");
  expect(money(total(funding.seasons, "paidByOwner"))).toBe("830.69");
});
