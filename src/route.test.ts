import { expect, test } from "vitest";
import { HOME, resolve, type Route, type ViewId } from "./route";

const records = new Map<string, ViewId>([
  ["pl-core-decision", "timeline"], ["1A", "ledger"], ["appeal-deadline", "next"], ["2011-12", "seasons"],
]);
const onLedger: Route = { view: "ledger", target: null };

test("no fragment opens the timeline", () => {
  expect(resolve("", onLedger, records)).toEqual(HOME);
});

test("a view name opens that view", () => {
  expect(resolve("#next", HOME, records)).toEqual({ view: "next", target: "next" });
});

test("a record id opens the view that holds it", () => {
  expect(resolve("#1A", HOME, records)).toEqual({ view: "ledger", target: "1A" });
  expect(resolve("#pl-core-decision", onLedger, records)).toEqual({ view: "timeline", target: "pl-core-decision" });
  expect(resolve("#appeal-deadline", HOME, records)).toEqual({ view: "next", target: "appeal-deadline" });
  expect(resolve("#2011-12", HOME, records)).toEqual({ view: "seasons", target: "2011-12" });
});

test("a page anchor keeps the current view", () => {
  expect(resolve("#method", onLedger, records)).toEqual({ view: "ledger", target: "method" });
});

test("a fragment that names nothing keeps the current view", () => {
  expect(resolve("#not-a-record", onLedger, records)).toEqual({ view: "ledger", target: "not-a-record" });
});

// Both of these used to leave the page blank.
test("a malformed escape is not decoded", () => {
  expect(resolve("#%E0%A4%A", onLedger, records)).toEqual({ view: "ledger", target: "%E0%A4%A" });
});

test("a name every object has is not a record", () => {
  expect(resolve("#toString", onLedger, records).view).toBe("ledger");
  expect(resolve("#constructor", HOME, records).view).toBe("timeline");
});
