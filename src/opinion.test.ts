import { expect, test } from "vitest";
import { updates } from "./data";
import { isOpinion } from "./opinion";

const guardian = (title: string) => isOpinion({ publisher: "The Guardian", title });

test("a Guardian headline signed by its writer is opinion", () => {
  expect(guardian("Sham City: verdict is damning and punishment must be severe | Jonathan Wilson")).toBe(true);
  expect(guardian("The ultra-rich face … accountability? | Leander Schaerlaeckens")).toBe(true);
  expect(guardian("Fans are right to feel angry | Marina van der Berg")).toBe(true);
  expect(guardian("The Guardian view on football’s regulator: overdue | Editorial")).toBe(true);
});

test("a news headline is not", () => {
  expect(guardian("Manchester City could be forced to pay Premier League up to £50m in legal costs")).toBe(false);
  expect(guardian("Manchester City lodge appeal as FA warns of major implications: football news – as it happened")).toBe(false);
});

test("the newsletter, which begins with a bar, is not", () => {
  expect(guardian("Football Daily | Manchester City lace up their gloves ready for another round. Bring your dinner")).toBe(false);
});

test("only the Guardian's headlines are read this way", () => {
  expect(isOpinion({ publisher: "BBC Sport", title: "What next for City? | Phil McNulty" })).toBe(false);
});

// The feed changes every hour, so this pins nothing about its contents. It only
// checks that the rule runs over whatever is there.
test("every stored headline can be classified", () => {
  for (const update of updates) expect(typeof isOpinion(update)).toBe("boolean");
});
