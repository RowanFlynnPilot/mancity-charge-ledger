# The Charge Ledger

A public, neutral record of the financial-rules cases involving Manchester City: what was alleged, what was decided, by whom, and what happens next. Every statement in the tool links to its source.

Repo: `RowanFlynnPilot/mancity-charge-ledger`. Pages URL: `https://rowanflynnpilot.github.io/mancity-charge-ledger/`. This file is the handoff context for every Claude Code session. Read it first.

## Ownership

A personal project by Rowan Flynn, hosted under the `RowanFlynnPilot` GitHub account and published under that name. It carries no newsroom or organisation logo, branding or design tokens.

## Status

As of 1 Oct 2026:

- Done: data contract (`src/types.ts`), validator (`pipeline/validate.py`), seed data (4 cases, 19 events, 10 charges, 3 pending items), feed fetcher (`pipeline/fetch_updates.py`), the Vite app with all four views, the methodology note and linkable entries, and both workflows.
- Live since 2 Oct 2026 at the Pages URL. Pages is set to deploy from GitHub Actions.
- The Core Decision was read in full on 2 Oct 2026 (build step 2). No `null` period could be filled. See "What the Core Decision does and does not establish" below.
- Not done: step 6 (`seasons.json` and the season view).
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
pipeline/fetch_updates.py RSS → updates.json
pipeline/test_*.py        unittest, stdlib only
src/data.ts               the JSON, typed, plus lookups
src/route.ts              URL fragment → view and entry
src/dates.ts              date formatting, "today" in London, due notes
src/rail.ts               geometry of the timeline's lane rail
src/components/           one file per view, plus shared pieces
src/styles.css            all styles and the design tokens
.github/workflows/        deploy.yml (check, build, Pages), updates.yml (cron fetch)
```

## Commands

```
python pipeline/validate.py              validate data/
python -m unittest discover pipeline     pipeline tests
python pipeline/fetch_updates.py         refresh data/updates.json from the feeds
npm run dev                              dev server (base path /mancity-charge-ledger/)
npm test                                 app tests (vitest)
npm run build                            typecheck, then build to dist/
```

The pipeline uses the Python standard library only. There is no `requirements.txt`.

## Data rules

- `src/types.ts` defines the shapes. `pipeline/validate.py` enforces them. Change both together or not at all.
- Dates are `YYYY-MM-DD`, or `YYYY-MM` when only the month is established. Never guess a day.
- `events.json` stays sorted by date ascending. The validator fails otherwise.
- An event can belong to more than one case (`caseIds`). The Der Spiegel leak sits in two lanes.
- `Charge.period` is `null` until the period is read from the published decision. `null` renders as nothing, not as a placeholder.
- When a pending item happens, add it to `events.json` and delete it from `pending.json` in the same commit.
- `updates.json` is never hand-edited. A feed item becomes part of the record only when a person writes an event for it.
- Record ids are URL fragments. They use letters, digits and single hyphens, and are unique across cases, events, charges and pending items. `timeline`, `ledger`, `next`, `latest` and `method` are reserved for the app.
- `Case.cityPositionEventId` points at the `statement` event that records City's position. It is required for any case that has charges; the validator fails otherwise. This is how editorial rule 3 is enforced: the ledger and the timeline read City's position from that event. When City's position changes, add a new statement event and repoint the field.
- One URL is always cited with the same title, publisher and kind. The validator fails on a mismatch.
- `Update.publishedAt` is UTC, `YYYY-MM-DDTHH:MM:SSZ`, so string order is time order. `Update.id` must equal the sha1 of `Update.url`.

## Pipeline: `fetch_updates.py`

One job: read RSS feeds, keep the items about these cases, write `data/updates.json`.

- Feeds are a fixed list at the top of the file. All three were requested on 1 Oct 2026 and returned valid RSS.
  - `https://www.skysports.com/rss/12040` (Sky Sports news, all sports). 20 items, spanning about 5.5 hours when checked, so a 3-hour cron does not miss items.
  - `https://feeds.bbci.co.uk/sport/football/rss.xml` (BBC Sport football).
  - `https://www.theguardian.com/football/manchestercity/rss` (The Guardian, Manchester City).
- Keep an item when title + description mention the club (`Man City` or `Manchester City`) and at least one case term: `charges`, `commission`, `appeal`, `sanction`, `verdict`, `breach`, `tribunal`, `APT`, `points deduction`, `expulsion`, `financial rules`, `guilty`, `ruling`, `findings`, `hearing`. Terms match at the start of a word (`appeal` catches `appeals`). `APT` is case-sensitive and whole-word, so it does not hit `captain` or `apt`. Markup is stripped before matching.
- The filter is loose by design. It lets through the odd unrelated item that mentions the club and a term in passing. The Latest view is labelled as unchecked press coverage for that reason.
- `title`, `link` and `pubDate` are required and a missing one raises. `description` may be empty; publishers do send that.
- Sky stamps dates with `BST`, which is not an RFC 822 zone. The fetcher maps it to `+0100` and raises on any other zone name it cannot resolve.
- The URL is stored without its query string (BBC appends tracking parameters). `id` is the sha1 of that URL. Merge with the existing file, sort newest first, keep the latest 200.
- Any HTTP error or unparseable feed raises. A red workflow run is the alert. Do not catch and continue.

Workflows:

- `updates.yml`: cron every 3 hours → `fetch_updates.py` → `validate.py` → commit `data/updates.json` if it changed → call `deploy.yml`. The call is needed because a push made with the workflow's own token does not trigger other workflows.
- `deploy.yml`: on push to `main`, pull request, manual run, or a call from `updates.yml`. Runs `validate.py`, the pipeline tests, the app tests and the build. Off pull requests it then deploys to Pages.

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
- **Linkable items.** Every event, charge and pending item gets a URL fragment from its `id` (`#pl-core-decision`, `#1A`), so one item can be cited or shared on its own. The fragment opens the right view, scrolls to the entry and marks it. Views are fragments too (`#ledger`).

How the views are built:

- The views are links, not ARIA tabs, so the back button and shared URLs work. `src/route.ts` resolves the fragment.
- The timeline's lane rail is the page's one distinctive device: a vertical line per case, a dot per event, a tie where an event sits in two lanes, a dashed end for a case that is still open. Cases City brought (`cityRole: "claimant"`) are drawn with open dots, which is how editorial rule 6 shows in the UI.
- The ledger shows City's position (from `cityPositionEventId`), the appeal state counted from the charges' `appeal` fields, and the next pending item, above the table. A ruling or sanction in the timeline carries a "City's position" line for the same reason.
- An `appeal` of `overturned` strikes through the finding badge.
- Due dates are compared with today's date in London. A pending item whose date has passed says so and says no outcome is recorded yet.
- The methodology note sits below every view and links to the public edit history of `data/` on GitHub.

## Build order

1. Done. Vite (React + TS) in the repo root, keeping `src/types.ts`. `validate.py` runs in CI.
2. Done, with nothing to fill. The published text does not state the missing periods. Repeat when the appendices are published.
3. Done. Feed list confirmed, `fetch_updates.py` built, cron workflow added.
4. Done. The four views, the methodology note and linkable entries.
5. Done. Deployed by `deploy.yml`.
6. `seasons.json` and the season view.

## What the Core Decision does and does not establish

From a full read of the redacted Core Decision (40 pages, 160 paragraphs) on 2 Oct 2026. Paragraph numbers are the decision's own.

The PDF is a scan. Pages 12–14, 19–21, 24–25 and 40 have no text layer, so text extraction skips them. They must be read as images. Redactions are burned in; no redacted text is recoverable, and none may be filled in from elsewhere.

Periods:

- 1(A) and 1(D): nine seasons, 2009/10 to 2017/18 (paras 81, 101, 113, 143). Already recorded.
- 2: the decision speaks of "the seasons to which Charge 2 relates" without listing them. The recorded 2013/14 to 2017/18 rests on para 81(b), which says the club's UEFA submissions in those seasons relied on the disputed figures.
- 3: 2015/16 to 2017/18 rests on para 81(a)(ii) in the same way.
- 1(B): four, six and one seasons for its three limbs (paras 118, 125, 132). The seasons themselves are redacted (para 101(b)–(d)). Stays `null`.
- 1(C): the seasons are redacted (para 101(e)). Footnote 12 names 2014/15 and 2017/18 only in connection with sums not paid. Stays `null`.
- 4(A)–(D): no period is stated. The detail is in Appendices 33 and 34, which are not published. Stays `null`.

Dates. The decision confirms dates already in `events.json`: proceedings began February 2023 (para 1); the hearing sat on 42 days from 16 Sep to 6 Dec 2024 (page 1, para 16); 27 factual witnesses (para 27); the UEFA settlement was May 2014 (para 102); the Der Spiegel articles were November 2018 (para 103). The decision itself carries no visible date: the signature block on page 40 is redacted. It gives two further dates, neither of which is a step in a case, so neither is an event: ADUG bought 90% of the club in September 2008 (para 49), and an episode on 25 May 2013 that the Commission uses as an example (paras 88–89).

Figures the decision states exactly: £949.94 million recorded as sponsorship income from Abu Dhabi sponsors across 2009/10 to 2017/18, of which £119.25 million was paid by the sponsors and £830.69 million by ADUG (para 72, with a season-by-season table in footnote 8).

## Visual identity

Its own, neutral. Reference-book plain: the documents are the content.

- No club colours. No sky blue, and no rival club's red either. Either one reads as taking a side.
- Do not reuse another project's design tokens.
- Colour carries meaning in exactly one place: the `finding` and `appeal` badges. Each badge also has a text label, so colour is never the only signal.
- Chosen 1 Oct 2026. The tokens live at the top of `src/styles.css`, with a dark set under `prefers-color-scheme: dark`.
  - Surfaces: paper `#f2f4ef` (the pale green-grey of ledger paper), sheet `#fbfcfa`, ink `#1a1d1b`, soft ink `#505752`, rules `#ccd3ca` and `#79827a`. There is no accent colour. Links are underlined ink.
  - Finding badges are plum `#53306f`: solid for proven, tinted for proven in part, outlined for not proven, each with a full, half or empty disc.
  - Appeal badges are bronze `#6b4700`: grey outline for none, tinted for pending, solid for upheld, solid ink for overturned.
  - Every text and badge pairing is at least 6:1 contrast in both themes.
  - Type: Literata (variable, optical size) for reading and headings, italic for case names as law reports set them. Archivo (variable, slightly condensed) for dates, references, labels and controls. Both are self-hosted through `@fontsource-variable`, so the site makes no third-party requests.
  - Layout: a left margin column carries the key (date, charge reference, label) and the body carries the entry, on every view. Rows are ruled. A double rule marks the masthead, the ledger's reference column and the methodology note.

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
