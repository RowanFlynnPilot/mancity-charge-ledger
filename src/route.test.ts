import { expect, test } from "vitest";
import { HOME, resolve, type Route, type ViewId } from "./route";

const records: Record<string, ViewId> = { "pl-core-decision": "timeline", "1A": "ledger", "appeal-deadline": "next" };
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
});

test("a page anchor keeps the current view", () => {
  expect(resolve("#method", onLedger, records)).toEqual({ view: "ledger", target: "method" });
});
