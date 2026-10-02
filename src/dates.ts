import type { LedgerDate } from "./types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_MS = 86_400_000;

// "2026-09-29" -> "29 Sep 2026"; "2014-05" -> "May 2014".
export function formatDate(date: LedgerDate, month: "short" | "long" = "short"): string {
  const [year, monthNumber, day] = date.split("-") as [string, string, string?];
  const name = MONTHS[Number(monthNumber) - 1]!;
  const label = month === "short" ? name.slice(0, 3) : name;
  return day ? `${Number(day)} ${label} ${year}` : `${label} ${year}`;
}

// Dates in the record are UK dates, so "today" is the date in London.
export function londonDate(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(instant);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function londonTime(instant: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(instant);
}

export interface DueNote {
  text: string;
  passed: boolean;
}

// How a due date stands against today. null when there is nothing to add to the date itself.
export function dueNote(due: LedgerDate | null, today: string): DueNote | null {
  if (due === null) return null;
  if (due.length === 7) {
    const thisMonth = today.slice(0, 7);
    if (due > thisMonth) return null;
    return due === thisMonth
      ? { text: "This month", passed: false }
      : { text: "This month has passed. No outcome is recorded here yet.", passed: true };
  }
  const days = Math.round((Date.parse(due) - Date.parse(today)) / DAY_MS);
  if (days > 1) return { text: `In ${days} days`, passed: false };
  if (days === 1) return { text: "Tomorrow", passed: false };
  if (days === 0) return { text: "Today", passed: false };
  return { text: "This date has passed. No outcome is recorded here yet.", passed: true };
}

// Dated items first, soonest first; then undated items in file order.
export function byDue<T extends { due: LedgerDate | null }>(items: T[]): T[] {
  const dated = items.filter((i) => i.due !== null).sort((a, b) => a.due!.localeCompare(b.due!));
  return [...dated, ...items.filter((i) => i.due === null)];
}
