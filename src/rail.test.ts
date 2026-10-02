import { expect, test } from "vitest";
import { buildRows, railCells } from "./rail";
import type { Case, CaseEvent, CaseId } from "./types";

const lane = (id: CaseId, status: Case["status"]): Case => ({
  id, name: id, body: "", cityRole: "respondent", status, outcome: "", cityPositionEventId: null,
});

const event = (id: string, date: string, ...caseIds: CaseId[]): CaseEvent => ({
  id, caseIds, date, type: "ruling", headline: id, summary: "", sources: [],
});

const closed = lane("uefa-2020", "closed");
const open = lane("pl-2023", "open");
const lanes = [closed, open];

// Newest first, as the timeline shows it by default.
const ordered = [
  event("decision", "2026-09-29", "pl-2023"),
  event("cas", "2020-07-13", "uefa-2020"),
  event("leak", "2018-11", "uefa-2020", "pl-2023"),
];

// One character per lane: "|" line through, "o" dot, ":" ongoing, "." nothing.
const draw = (cells: ReturnType<typeof railCells>) =>
  cells.map((row) => row.map((c) => (c.ongoing ? ":" : c.dot ? "o" : c.above && c.below ? "|" : ".")).join(""));

test("adds a heading row per year and an ongoing row at the newer end", () => {
  expect(buildRows(ordered, lanes, true).map((r) => r.kind))
    .toEqual(["ongoing", "year", "event", "year", "event", "year", "event"]);
  expect(buildRows([...ordered].reverse(), lanes, false).at(-1)).toEqual({ kind: "ongoing" });
});

test("no ongoing row when every case shown is closed", () => {
  expect(buildRows(ordered, [closed], true)[0]).toEqual({ kind: "year", year: "2026" });
});

test("a closed case's line stops at its last event; an open case's carries on", () => {
  const rows = buildRows(ordered, lanes, true);
  expect(draw(railCells(rows, lanes))).toEqual([
    ".:", // ongoing
    ".|", // 2026
    ".o", // decision
    ".|", // 2020
    "o|", // cas
    "||", // 2018
    "oo", // leak, in both lanes
  ]);
});

test("line ends are open only on the side that continues", () => {
  const rows = buildRows(ordered, lanes, true);
  const cells = railCells(rows, lanes);
  expect(cells[4]![0]).toMatchObject({ above: false, below: true }); // newest event of the closed case
  expect(cells[6]![0]).toMatchObject({ above: true, below: false }); // its oldest
  expect(cells[2]![1]).toMatchObject({ above: true, below: true }); // open case: line continues past its newest
});

test("a lane with no events draws nothing", () => {
  const rows = buildRows([ordered[0]!], lanes, true);
  expect(railCells(rows, lanes).every((row) => !row[0]!.dot && !row[0]!.above && !row[0]!.below)).toBe(true);
});
