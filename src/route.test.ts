import { expect, test } from "vitest";
import { HOME, NOT_FOUND, resolve, type Route, type ViewId } from "./route";

const records = new Map<string, ViewId>([
  ["pl-core-decision", "timeline"], ["city-appeal-lodged", "timeline"], ["1A", "ledger"],
  ["sanction-hearing", "next"], ["2011-12", "seasons"],
]);
const moved = new Map([["appeal-deadline", "city-appeal-lodged"]]);
const onLedger: Route = { view: "ledger", target: null };

const at = (hash: string, previous: Route = HOME) => resolve(hash, previous, records, moved);

test("no fragment opens the timeline", () => {
  expect(at("", onLedger)).toEqual(HOME);
});

test("a view name opens that view", () => {
  expect(at("#next")).toEqual({ view: "next", target: "next" });
});

test("a record id opens the view that holds it", () => {
  expect(at("#1A")).toEqual({ view: "ledger", target: "1A" });
  expect(at("#pl-core-decision", onLedger)).toEqual({ view: "timeline", target: "pl-core-decision" });
  expect(at("#sanction-hearing")).toEqual({ view: "next", target: "sanction-hearing" });
  expect(at("#2011-12")).toEqual({ view: "seasons", target: "2011-12" });
});

test("an id that has moved opens the record it moved to", () => {
  expect(at("#appeal-deadline", onLedger)).toEqual({ view: "timeline", target: "city-appeal-lodged" });
});

test("a page anchor keeps the current view", () => {
  expect(at("#method", onLedger)).toEqual({ view: "ledger", target: "method" });
  expect(at("#funding", onLedger)).toEqual({ view: "ledger", target: "funding" });
});

test("a fragment that names nothing keeps the current view and says so", () => {
  expect(at("#not-a-record", onLedger)).toEqual({ view: "ledger", target: NOT_FOUND });
});

// Both of these used to leave the page blank.
test("a malformed escape is not decoded", () => {
  expect(at("#%E0%A4%A", onLedger)).toEqual({ view: "ledger", target: NOT_FOUND });
});

test("a name every object has is not a record", () => {
  expect(at("#toString", onLedger)).toEqual({ view: "ledger", target: NOT_FOUND });
  expect(at("#constructor")).toEqual({ view: "timeline", target: NOT_FOUND });
});
