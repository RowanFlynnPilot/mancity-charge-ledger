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
// and single hyphens, unique across cases, events, charges, pending items and seasons.

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
  id: string; // "1A", "4B", "2": the Commission's number, then its letter if it has one
  caseId: CaseId;
  ref: string; // "Charge 1(A)"
  subject: string;
  period: string | null; // null = not yet established from the published text
  finding: Finding;
  appeal: AppealState;
  summary: string;
  sources: Source[]; // primary only
}

// data/funding.json: the season-by-season figures behind one finding, entered
// by hand from the published decision. Amounts are in £ million.
export interface FundingSeason {
  season: string; // "2009/10"
  recorded: number; // sponsorship fees recorded in the club's accounts
  paidBySponsors: number; // the part the Commission found the sponsors paid
  paidByOwner: number; // the part it found the owner paid; the two add up to recorded
}

export interface Funding {
  chargeId: string; // the charge whose finding these figures belong to
  locator: string; // where in the source the figures are
  sources: Source[]; // primary only
  seasons: FundingSeason[]; // sorted ascending
}

// data/allegations.json: the breaches the League alleged, as its charge statement
// lists them: rule numbers, season by season, in groups. Entered by hand.
export interface AllegationSeason {
  season: string; // "2009/10"
  rules: string[]; // as cited: "B.13", or a range, "E.52 to E.60"
  note: string | null; // anything a reader needs to know about how this season is counted
}

export interface AllegationGroup {
  id: string;
  subject: string; // what the rules require, in our words
  chargeIds: string[]; // the Commission's charges that decided these, matched by rule number
  seasons: AllegationSeason[]; // sorted ascending
}

export interface Allegations {
  sources: Source[]; // primary only: the statement
  // A total used in press coverage. Shown beside the record's own count, attributed.
  pressTally: { count: number; sources: Source[] };
  groups: AllegationGroup[];
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

// data/seasons.json: written by pipeline/build_seasons.py from the Premier
// League's final tables, sorted ascending. One row per season the charges cover.
export interface Season {
  id: string; // "2009-10"
  label: string; // "2009/10"
  cityPosition: number; // City's finishing position
  champion: string;
  runnerUp: string;
  sources: Source[]; // primary only: the League's final table
}

// data/updates.json: written only by pipeline/fetch_updates.py, newest first.
export interface Update {
  id: string; // sha1 of url
  title: string;
  url: string;
  publisher: string;
  publishedAt: string; // UTC, "YYYY-MM-DDTHH:MM:SSZ"
}
