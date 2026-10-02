import { expect, test } from "vitest";
import { ordinal } from "./ordinal";

test("league positions as ordinals", () => {
  expect([1, 2, 3, 4, 5].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "5th"]);
  expect([10, 11, 12, 13, 14, 20].map(ordinal)).toEqual(["10th", "11th", "12th", "13th", "14th", "20th"]);
});
