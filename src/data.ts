// The record, typed. pipeline/validate.py is what guarantees these casts hold.
import casesJson from "../data/cases.json";
import chargesJson from "../data/charges.json";
import eventsJson from "../data/events.json";
import fundingJson from "../data/funding.json";
import pendingJson from "../data/pending.json";
import seasonsJson from "../data/seasons.json";
import updatesJson from "../data/updates.json";
import type { ViewId } from "./route";
import type { Case, CaseEvent, CaseId, Charge, Funding, PendingItem, Season, Update } from "./types";

export const cases = casesJson as Case[];
export const events = eventsJson as CaseEvent[];
export const charges = chargesJson as Charge[];
export const pending = pendingJson as PendingItem[];
export const seasons = seasonsJson as Season[];
export const funding = fundingJson as Funding;
export const updates = updatesJson as Update[];

export const caseById = Object.fromEntries(cases.map((c) => [c.id, c])) as Record<CaseId, Case>;
export const eventById = new Map(events.map((e) => [e.id, e]));

// Which view holds each linkable record (#pl-core-decision, #1A).
export const viewOfRecord: Record<string, ViewId> = Object.fromEntries([
  ...events.map((e) => [e.id, "timeline"] as const),
  ...charges.map((c) => [c.id, "ledger"] as const),
  ...pending.map((p) => [p.id, "next"] as const),
  ...seasons.map((s) => [s.id, "seasons"] as const),
]);

// events.json is sorted ascending, so the last entry is where the record ends.
export const recordRunsTo = events[events.length - 1]!.date;
