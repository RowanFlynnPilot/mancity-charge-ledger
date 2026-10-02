// Geometry for the timeline's lane rail: one vertical line per case, a dot
// where an event sits in that lane.
import type { Case, CaseEvent } from "./types";

export type Row =
  | { kind: "ongoing" } // the open end of the record, beyond the newest event
  | { kind: "year"; year: string }
  | { kind: "event"; event: CaseEvent };

export interface Cell {
  above: boolean; // line from the top of the row to the dot
  below: boolean; // line from the dot to the bottom of the row
  dot: boolean;
  ongoing: boolean; // dashed: the case is open and continues past the record
}

const EMPTY: Cell = { above: false, below: false, dot: false, ongoing: false };

// Events in display order, with a heading row at each change of year and an
// "ongoing" row at the newer end when any lane's case is still open.
export function buildRows(ordered: CaseEvent[], lanes: Case[], newestFirst: boolean): Row[] {
  const rows: Row[] = [];
  let year = "";
  for (const event of ordered) {
    if (event.date.slice(0, 4) !== year) {
      year = event.date.slice(0, 4);
      rows.push({ kind: "year", year });
    }
    rows.push({ kind: "event", event });
  }
  if (lanes.some((c) => c.status === "open")) {
    if (newestFirst) rows.unshift({ kind: "ongoing" });
    else rows.push({ kind: "ongoing" });
  }
  return rows;
}

// One Cell per lane for every row. A lane's line runs from its first event to
// its last; an open case's line carries on into the "ongoing" row.
export function railCells(rows: Row[], lanes: Case[]): Cell[][] {
  const grid = rows.map(() => lanes.map(() => EMPTY));
  const ongoingRow = rows.findIndex((r) => r.kind === "ongoing");
  lanes.forEach((lane, column) => {
    const hasDot = rows.map((r) => r.kind === "event" && r.event.caseIds.includes(lane.id));
    const reach = hasDot.flatMap((dot, i) => (dot ? [i] : []));
    if (reach.length === 0) return;
    if (lane.status === "open" && ongoingRow !== -1) reach.push(ongoingRow);
    const from = Math.min(...reach);
    const to = Math.max(...reach);
    for (let i = from; i <= to; i++) {
      grid[i]![column] = {
        above: i > from,
        below: i < to,
        dot: hasDot[i]!,
        ongoing: i === ongoingRow,
      };
    }
  });
  return grid;
}
