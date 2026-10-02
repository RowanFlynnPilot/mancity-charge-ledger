import { expect, test } from "vitest";
import { byDue, dueNote, formatDate, londonDate, londonTime } from "./dates";

test("formats a full date and a month-only date", () => {
  expect(formatDate("2026-09-29")).toBe("29 Sep 2026");
  expect(formatDate("2026-09-02", "long")).toBe("2 September 2026");
  expect(formatDate("2014-05")).toBe("May 2014");
});

test("today is the date in London, not in UTC or the reader's zone", () => {
  // 23:30 UTC on 1 Oct is 00:30 on 2 Oct in London during summer time.
  expect(londonDate(new Date("2026-10-01T23:30:00Z"))).toBe("2026-10-02");
  expect(londonDate(new Date("2026-12-01T23:30:00Z"))).toBe("2026-12-01");
  expect(londonTime(new Date("2026-10-01T21:41:00Z"))).toBe("22:41");
});

test("describes a due date against today", () => {
  expect(dueNote("2026-10-02", "2026-09-29")).toEqual({ text: "In 3 days", passed: false });
  expect(dueNote("2026-10-02", "2026-10-01")).toEqual({ text: "Tomorrow", passed: false });
  expect(dueNote("2026-10-02", "2026-10-02")).toEqual({ text: "Today", passed: false });
  expect(dueNote("2026-10-02", "2026-10-03")?.passed).toBe(true);
  // Across a month boundary and a clock change.
  expect(dueNote("2026-11-01", "2026-10-20")).toEqual({ text: "In 12 days", passed: false });
});

test("describes a month-only due date", () => {
  expect(dueNote("2026-11", "2026-10-02")).toBeNull();
  expect(dueNote("2026-10", "2026-10-02")).toEqual({ text: "This month", passed: false });
  expect(dueNote("2026-09", "2026-10-02")?.passed).toBe(true);
});

test("an undated item has no note", () => {
  expect(dueNote(null, "2026-10-02")).toBeNull();
});

test("orders dated items soonest first, then undated in file order", () => {
  const items = [{ id: "a", due: null }, { id: "b", due: "2026-11" }, { id: "c", due: "2026-10-02" }, { id: "d", due: null }];
  expect(byDue(items).map((i) => i.id)).toEqual(["c", "b", "a", "d"]);
});
