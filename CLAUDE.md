# The Charge Ledger

A public, neutral record of the financial-rules cases involving Manchester City: what was alleged, what was decided, by whom, and what happens next. Every statement in the tool links to its source.

Repo: `RowanFlynnPilot/mancity-charge-ledger`. Pages URL: `https://rowanflynnpilot.github.io/mancity-charge-ledger/`. This file is the handoff context for every Claude Code session. Read it first.

## Ownership

A personal project by Rowan Flynn, hosted under the `RowanFlynnPilot` GitHub account and published under that name. It carries no newsroom or organisation logo, branding or design tokens.

## Status

As of 1 Oct 2026:

- Done: data contract (`src/types.ts`), validator (`pipeline/validate.py`), seed data (4 cases, 19 events, 10 charges, 3 pending items). `python pipeline/validate.py` passes.
- Not started: Vite app, feed fetcher, GitHub Actions, Pages deploy.
- The story is live. The Commission's Core Decision was published 29 Sep 2026. The appeal deadline is 2 Oct 2026. Sanction is undecided.

## Editorial rules

These are not style preferences. They are what makes the tool publishable.

1. **Attribute every finding.** The tool never says City "cheated" or "is guilty" in its own voice. It says what the Commission, UEFA, CAS or a tribunal found, and links the document.
2. **Status lives in data, never in copy.** A charge's `finding` and `appeal` fields drive every label. If an appeal changes an outcome, the fix is a data edit, not a rewrite.
3. **City's position travels with the findings.** Wherever Commission findings are shown, the view also shows that City denies wrongdoing and the current appeal state.
4. **Primary over press.** `charges.json` cites primary documents only. Events may cite press, but add the primary document when one exists.
5. **Redactions stay redacted.** The published Core Decision redacts names of people and sponsors. `charges.json` does not fill them in from press reports.
6. **The APT case is a different kind of case.** City brought it (`cityRole: "claimant"`). It is not an allegation against the club and must not be styled as one.
7. **No "115".** The Commission's own structure is Charges 1(A)–(D), 2, 3 and 4(A)–(D), covering "well over 100" individual breaches. The ledger is keyed to that structure. Press tallies (115, 114, 130) appear only in event summaries, attributed.
8. **Summaries are our own words.** No pasted paragraphs from sources.

## Stack

Python pipeline → static JSON in `data/` → GitHub Actions → React + Vite + TypeScript → GitHub Pages. It is a standalone site, not an embed.

No database. No server. No auth.

## Layout

```
CLAUDE.md
src/types.ts              data contract (source of truth for shapes)
data/cases.json           the four cases                      hand-edited
data/events.json          timeline, sorted ascending          hand-edited
data/charges.json         Commission charge ledger            hand-edited
data/pending.json         due but not yet happened            hand-edited
data/updates.json         news feed, newest first             written by the pipeline only
pipeline/validate.py      raises on first contract violation
pipeline/fetch_updates.py (to build) RSS → updates.json
```

## Data rules

- `src/types.ts` defines the shapes. `pipeline/validate.py` enforces them. Change both together or not at all.
- Dates are `YYYY-MM-DD`, or `YYYY-MM` when only the month is established. Never guess a day.
- `events.json` stays sorted by date ascending. The validator fails otherwise.
- An event can belong to more than one case (`caseIds`). The Der Spiegel leak sits in two lanes.
- `Charge.period` is `null` until the period is read from the published decision. `null` renders as nothing, not as a placeholder.
- When a pending item happens, add it to `events.json` and delete it from `pending.json` in the same commit.
- `updates.json` is never hand-edited. A feed item becomes part of the record only when a person writes an event for it.

## Pipeline: `fetch_updates.py`

One job: read RSS feeds, keep the items about these cases, write `data/updates.json`.

- Feeds are a fixed list at the top of the file.
  - `https://www.skysports.com/rss/12040` (Sky Sports news, all sports). Confirmed reachable 1 Oct 2026, standard RSS with `title`, `description`, `link`, `pubDate`.
  - `https://feeds.bbci.co.uk/sport/football/rss.xml` and `https://www.theguardian.com/football/manchestercity/rss` are candidates that could not be reached from the sandbox where this scaffold was built. Request each once in session 1. Keep the ones that return valid RSS and remove the rest from this file.
- Keep an item when title + description mention the club (`Man City` or `Manchester City`) and at least one case term: `charges`, `commission`, `appeal`, `sanction`, `verdict`, `breach`, `tribunal`, `APT`, `points deduction`, `expulsion`, `financial rules`.
- `id` is the sha1 of the URL. Merge with the existing file, sort newest first, keep the latest 200.
- Any HTTP error or unparseable feed raises. A red workflow run is the alert. Do not catch and continue.

Workflow: cron every 3 hours → `fetch_updates.py` → `validate.py` → commit `data/updates.json` if it changed. A push to `main` builds and deploys Pages.

## UI

Four views in v1, one page, tabbed:

1. **Timeline.** One lane per case, filter by case, each event shows date, headline, summary, sources. Primary sources get a badge.
2. **Charge ledger.** The ten Commission charges with `finding` and `appeal` badges, summary, link to the Core Decision.
3. **What's next.** `pending.json`, dated items first.
4. **Latest.** `updates.json`, labelled as press coverage, not as part of the record.

Then v1.1: **Season view.** For 2009/10 to 2017/18, City's finishing position, the champion and the runner-up, each row sourced. Needs a `data/seasons.json` built from a citable final-table source, not from memory.

This is a personal project. No organisation logo or branding appears in the UI.

Two things a public reference needs that the four views don't cover:

- **Methodology note.** A short section on the page: what counts as a primary source, what counts as press, that findings are attributed and City's position is shown, who maintains it (Rowan Flynn), and how to report a correction.
- **Linkable items.** Every event and charge gets a URL fragment from its `id` (`#pl-core-decision`, `#1A`), so one item can be cited or shared on its own.

## Build order

1. `npm create vite@latest` (React + TS) in the repo root, keeping `src/types.ts`. Add `validate.py` to CI.
2. Read the full Core Decision PDF. Fill the `null` periods in `charges.json` where the published text states them. Add any dated events it establishes.
3. Confirm the feed list, build `fetch_updates.py`, add the cron workflow.
4. Build the four views against the JSON.
5. Pages deploy.
6. `seasons.json` and the season view.

## Visual identity

Its own, neutral. Reference-book plain: the documents are the content.

- No club colours. No sky blue, and no rival club's red either. Either one reads as taking a side.
- Do not reuse another project's design tokens.
- Colour carries meaning in exactly one place: the `finding` and `appeal` badges. Each badge also has a text label, so colour is never the only signal.
- Palette and type are chosen in the UI session and recorded here once chosen.

## Open decisions

- The corrections email address for the methodology note. Not yet supplied. Leave the contact line out until it is.
- Whether Premier League and club statements, which have no RSS, are worth an HTML scrape. Until decided they enter by hand as events.

## Engineering rules

- One correct path. No fallbacks, no backup mechanisms, no compatibility shims.
- Fail fast and loud. Raise on bad input. Let TypeScript catch shape errors in the app instead of runtime checks.
- Surgical changes. One responsibility per function. Fix root causes.
- Debug with minimal, targeted logging, then remove it.

## Environment

Windows, PowerShell 5.1. Use `python -m pip`. Chain commands with `;`, not `&&`.
