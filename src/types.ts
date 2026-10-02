// Data contract for The Charge Ledger.
// pipeline/validate.py enforces the same rules on the JSON in data/.

export type CaseId = "uefa-2014" | "uefa-2020" | "pl-2023" | "apt";

// primary: a regulator, tribunal, court or club document.
// press:   reporting or commentary about one.
export type SourceKind = "primary" | "press";

export interface Source {
  title: string;
  publisher: string;
  url: string;
  kind: SourceKind;
}

// "YYYY-MM-DD", or "YYYY-MM" when only the month is established.
export type LedgerDate = string;

export interface Case {
  id: CaseId;
  name: string;
  body: string; // who decides it
  cityRole: "respondent" | "claimant";
  status: "open" | "closed";
  outcome: string; // one line, current state
  // The "statement" event recording City's position on the findings.
  // Required when the case has charges, so findings never appear without it.
  cityPositionEventId: string | null;
}

export type EventType =
  | "report"
  | "investigation"
  | "charge"
  | "hearing"
  | "ruling"
  | "sanction"
  | "settlement"
  | "statement"
  | "rule-change"
  | "filing";

// Record ids double as URL fragments (#pl-core-decision, #1A): letters, digits
// and single hyphens, unique across cases, events, charges and pending items.

// data/events.json: hand-curated, sorted by date ascending.
export interface CaseEvent {
  id: string;
  caseIds: CaseId[]; // one event can sit in more than one lane
  date: LedgerDate;
  type: EventType;
  headline: string;
  summary: string;
  sources: Source[]; // at least one
}

export type Finding = "proven" | "proven-in-part" | "not-proven";
export type AppealState = "none" | "pending" | "upheld" | "overturned";

// data/charges.json: keyed to the Commission's own charge structure.
export interface Charge {
  id: string; // "1A", "4B"
  caseId: CaseId;
  ref: string; // "Charge 1(A)"
  subject: string;
  period: string | null; // null = not yet established from the published text
  finding: Finding;
  appeal: AppealState;
  summary: string;
  sources: Source[]; // primary only
}

// data/pending.json: things that are due but have not happened.
// When one happens it becomes a CaseEvent and leaves this file.
export interface PendingItem {
  id: string;
  caseId: CaseId;
  label: string;
  due: LedgerDate | null; // null = no date published
  detail: string;
  sources: Source[];
}

// data/updates.json: written only by pipeline/fetch_updates.py, newest first.
export interface Update {
  id: string; // sha1 of url
  title: string;
  url: string;
  publisher: string;
  publishedAt: string; // UTC, "YYYY-MM-DDTHH:MM:SSZ"
}
