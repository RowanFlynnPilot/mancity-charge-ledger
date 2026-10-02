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
- The season view (v1.1) is built: `data/seasons.json` from the Premier League's final tables, and a Seasons view between the charge ledger and What's next.
- The story is live. The Commission's Core Decision was published 29 Sep 2026. City lodged its appeal on 1 Oct 2026, and the League confirmed it on 2 Oct. Neither statement lists the findings appealed; the nine charges found against City are recorded as `appeal: "pending"` because City calls the appeal comprehensive, and Charge 4(B), which City won, stays `none`. Sanction is undecided.

## Editorial rules

These are not style preferences. They are what makes the tool publishable.

1. **Attribute every finding.** The tool never says City "cheated" or "is guilty" in its own voice. It says what the Commission, UEFA, CAS or a tribunal found, and links the document.
2. **Status lives in data, never in copy.** A charge's `finding` and `appeal` fields drive every label. If an appeal changes an outcome, the fix is a data edit, not a rewrite.
3. **City's position travels with the findings.** Wherever Commission findings are shown, the view also shows that City denies wrongdoing and the current appeal state.
4. **Primary over press.** `charges.json` cites primary documents only. Events may cite press, but add the primary document when one exists.
5. **Redactions stay redacted.** The published Core Decision redacts names of people and sponsors. `charges.json` does not fill them in from press reports.
6. **The APT case is a different kind of case.** City brought it (`cityRole: "claimant"`). It is not an allegation against the club and must not be styled as one.
7. **Ten charges, and the count shown both ways.** The Commission's own structure is Charges 1(A)–(D), 2, 3 and 4(A)–(D), covering "well over 100" individual breaches. The ledger is keyed to that structure. Its second view counts the League's charge statement rule by season, states the method, and names the press figure of 115 beside the result, attributed to a press source held in `allegations.json`. A press tally is never presented as the record's own count, appears nowhere else except attributed event summaries, and never enters `charges.json`. (Relaxed on 2 Oct 2026 from a flat ban on naming 115: readers arrive expecting that number and need to see how it relates to the ten.)
8. **Summaries are our own words.** No pasted paragraphs from sources.

## Stack

Python pipeline → static JSON in `data/` and `feed/` → GitHub Actions → React + Vite + TypeScript → GitHub Pages. It is a standalone site, not an embed.

No database. No server. No auth.

## Layout

```
CLAUDE.md
README.md                 the repo's front page, for a visitor
LICENSE                   MIT, for the code
LICENSE-DATA.md           CC BY 4.0, for data/, and what it does not cover
design/social-card.html   draws public/og.png, the image a shared link shows
src/types.ts              data contract (source of truth for shapes)
data/cases.json           the four cases                      hand-edited
data/events.json          timeline, sorted ascending          hand-edited
data/charges.json         Commission charge ledger            hand-edited
data/pending.json         due but not yet happened            hand-edited
data/allegations.json     the League's statement, rule by season   hand-edited, from the charge statement
data/funding.json         sponsorship money by season         hand-edited, from the Core Decision
data/seasons.json         final tables, 2009/10 to 2017/18    written by build_seasons.py only
feed/updates.json         news feed, newest first             written by the pipeline only
pipeline/validate.py      raises on first contract violation
pipeline/fetch_updates.py RSS → feed/updates.json
pipeline/build_seasons.py Premier League final tables → seasons.json, run by hand
pipeline/check_links.py   requests every cited source; raises if one is dead
pipeline/test_*.py        unittest, stdlib only
src/render.test.tsx       renders the whole page with the real data, for every address
src/data.ts               the JSON, typed, plus lookups
src/route.ts              URL fragment → view and entry
src/dates.ts              date formatting, "today" in London, due notes
src/rail.ts               geometry of the timeline's lane rail
src/board.ts              charge groups for the findings board, and money totals
src/allegations.ts        counting the League's statement rule by season
src/components/           one file per view, plus shared pieces
src/styles.css            all styles and the design tokens
.github/workflows/        deploy.yml (check, build, Pages), updates.yml (cron fetch), links.yml (weekly link check)
```

## Commands

```
python pipeline/validate.py              validate data/
python -m unittest discover pipeline     pipeline tests
python pipeline/fetch_updates.py         refresh feed/updates.json from the feeds
python pipeline/build_seasons.py         rebuild data/seasons.json from the League's tables
python pipeline/check_links.py           request every cited source and report the dead ones
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
- `Charge.period` is `null` until the period is read from the published decision or another primary document. `null` renders as nothing, not as a placeholder.
- When a pending item happens, add it to `events.json` and delete it from `pending.json` in the same commit.
- `updates.json` is never hand-edited. A feed item becomes part of the record only when a person writes an event for it.
- `updates.json` lives in `feed/`, not `data/`. A workflow commits it every few hours, and the methodology note links to the commit history of `data/` as the record's edit history. Keeping the feed out of `data/` keeps that history to edits a person made.
- `seasons.json` is never hand-edited. `build_seasons.py` reads the Premier League's own standings for each season and raises unless it gets a complete final table (20 clubs, 38 matches each). Each row cites that season's table page on premierleague.com as a primary source. The validator checks that `cityPosition` agrees with `champion` and `runnerUp`. The file records the tables as the League publishes them: if a decision ever alters a final table, re-run the script.
- Charge ids are the Commission's number and letter (`1A`, `2`, `4B`). The validator enforces this, and the findings board groups charges by the number.
- `funding.json` holds the season-by-season sponsorship figures behind one finding (`chargeId`), entered by hand from the decision. Each season's two parts must add up to the recorded figure; the validator fails otherwise. Amounts are £ million. `locator` says where in the source the figures are. It is a single object, not a list.
- `allegations.json` transcribes the League's charge statement of 6 Feb 2023: the rule numbers it cites, season by season, in the statement's own groups. `chargeIds` on each group is this record's own match to the Commission's charges, made from the rule numbers the two documents share; the UI says so. `pressTally` holds the press figure and its source. The count is not stored. It is computed: each rule once per season, a range such as `E.52 to E.60` as nine. It comes to 130, and `src/allegations.test.ts` pins that number so a data edit cannot change the published count unnoticed. For 2009/10 the statement cites four rules before 10 September 2009 and five after; the data holds the five and a `note` says so.
- Record ids are URL fragments. They use letters, digits and single hyphens, and are unique across cases, events, charges, pending items and seasons. `timeline`, `ledger`, `seasons`, `next`, `latest`, `method`, `funding` and `allegations` are reserved for the app.
- `Case.cityPositionEventId` points at the `statement` event that records City's position. It is required for any case that has charges; the validator fails otherwise. This is how editorial rule 3 is enforced: the ledger and the timeline read City's position from that event. When City's position changes, add a new statement event and repoint the field.
- One URL is always cited with the same title, publisher and kind. The validator fails on a mismatch.
- `Update.publishedAt` is UTC, `YYYY-MM-DDTHH:MM:SSZ`, so string order is time order. `Update.id` must equal the sha1 of `Update.url`.

## Pipeline: `fetch_updates.py`

One job: read RSS feeds, keep the items about these cases, write `feed/updates.json`.

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

- `updates.yml`: cron every 3 hours → `fetch_updates.py` → `validate.py` → commit `feed/updates.json` if it changed → call `deploy.yml`. The call is needed because a push made with the workflow's own token does not trigger other workflows.
- `deploy.yml`: on push to `main`, pull request, manual run, or a call from `updates.yml`. Runs `validate.py`, the pipeline tests, the app tests and the build. Off pull requests it then deploys to Pages.
- `links.yml`: Mondays, by hand, or on a pull request that changes the checker. Runs `check_links.py`. It is kept out of `deploy.yml` so that another site being down cannot block a deploy.

## Pipeline: `check_links.py`

One job: request every source address in `data/` and say which are dead. The press feed is not checked; it is not part of the record.

- It checks every address before it raises, so one run names every dead link.
- Alive means a 2xx answer. For an address ending in `.pdf` the body must also start with `%PDF`, because `tas-cas.org` answers 200 with a web page for a file that has gone.
- Anything else is dead: any other status, no such host, a refused connection, a timeout. There is no retry. A site that was down for a moment makes a red run; run it again.
- It uses the same `User-Agent` as the feed fetcher, which names the project. It does not pose as a browser.
- `UNCHECKED_HOSTS` lists the sites that refuse the script: `www.mancity.com`, `www.uefa.com` and `www.farrer.co.uk` everywhere, and `www.pressreader.com` and `www.thelawyer.com` when it runs on GitHub's runners (they answer from a home connection). On 2 Oct 2026 that was 11 of the 37 addresses cited, among them every UEFA and club statement. Their links are printed as "not checked" and are not requested. Nothing checks them automatically; open them by hand when the weekly run is read. Add a host only after seeing it refuse the script while the page opens in a browser.
- A redirect counts as alive. The script does not report where a link ended up.

## App tests: `render.test.tsx`

The app casts the JSON to its types and reaches across records with `!`. TypeScript cannot see whether those joins hold; this test can.

- It renders `<App />` to markup for every view, for every record id, and for `#allegations`, with the real data. There is no browser: it stubs `window.location.hash`, which is the only thing the page reads from the browser while rendering.
- Every record's address must produce a page with that record's element on it. Every `href="#…"` on any view must lead to an element. So a link to an entry that has been renamed or removed fails the check.
- It fails if `undefined`, `NaN` or `[object Object]` appears in any view but Latest, whose headlines are not ours.
- Every `type`, `finding`, `appeal`, `status` and `cityRole` in the data must have a label. This is where drift between `validate.py` and the app shows up.
- Editorial rule 3 is tested: the opening and the ledger must link to the entry recording City's position for each case that has charges.
- A component that reads `window` or `document` while rendering will break this test. Keep those reads in effects and event handlers.

## UI

Four views in v1, one page, tabbed:

1. **Timeline.** One lane per case, filter by case, each event shows date, headline, summary, sources. Primary sources get a badge.
2. **Charge ledger.** The ten Commission charges with `finding` and `appeal` badges, summary, link to the Core Decision.
3. **What's next.** `pending.json`, dated items first.
4. **Latest.** `updates.json`, labelled as press coverage, not as part of the record.

Then v1.1, built: **Season view.** For 2009/10 to 2017/18, City's finishing position, the champion and the runner-up, each row sourced to the League's final table. It covers the seasons of the charges about the club's accounts and spending, and says the cooperation charges concern a later period; the table is not extended to those seasons, because setting league positions beside them would suggest a link the charges do not make. It states results as the tables record them and says nothing about what a sanction might change; that would be status in copy. It does not show findings, so it does not set charges against seasons. Doing that would need `Charge.period` to become structured data, and the seasons for 1(B), 1(C) and 4 are not public.

This is a personal project. No organisation logo or branding appears in the UI.

Two things a public reference needs that the four views don't cover:

- **Methodology note.** A short section on the page: what counts as a primary source, what counts as press, that findings are attributed and City's position is shown, who maintains it (Rowan Flynn), and how to report a correction.
- **Linkable items.** Every event, charge and pending item gets a URL fragment from its `id` (`#pl-core-decision`, `#1A`), so one item can be cited or shared on its own. The fragment opens the right view, scrolls to the entry and marks it. Views are fragments too (`#ledger`).

The opening, above the views (built 2 Oct 2026 to give the page a focal point):

- The view bar is at the very top and sticks there.
- The title is set at display size. Under it, each open case gets an exhibit: its name, a status tag, its `outcome` line, and, if it has charges, the findings board.
- The findings board draws one block per charge, filled by its `finding`, in the Commission's groups (1(A) to 1(D), 2, 3, 4(A) to 4(D)). Each block links to its charge in the ledger. City's position and the appeal state sit directly under it, because editorial rule 3 applies here as much as in the ledger.
- The sponsorship money exhibit is a table with a bar in each row, built from `funding.json`. Every figure is in the table, so nothing depends on reading the bars or on hovering. It shows the charge's finding and appeal badges, City's position, and the source. Its text attributes the figures to the Commission.

The charge ledger counts the case two ways, behind a switch:

- "The Commission's 10 charges" is the ledger table.
- "The League's 130 alleged breaches" is a grid built from `allegations.json`: the statement's groups down the side, the fourteen seasons from 2009/10 to 2022/23 across the top, and in each cell how many rules the statement cites. Each row carries the Commission charges that decided it, as chips showing their findings. Below it are the counting notes, the caveat that the match to charges is this record's own, the full list of rules, and the sources. `#allegations` opens this view.
- The grid's cells are neutral, not plum, because they show allegations. Plum appears only on the charge chips, which show findings.
- The findings board in the opening says what the ten charges add up to and links to the grid.
- What cannot be shown: which individual breaches fall under which finding. The Statement of Charges and the appendices that would show it are not published.

How the views are built:

- The views are links, not ARIA tabs, so the back button and shared URLs work. `src/route.ts` resolves the fragment. It compares the fragment as written, without decoding it, and looks records up in a `Map`: a reader can type anything after the `#`, and a malformed escape or a name such as `toString` must not stop the page rendering.
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
6. Done. `seasons.json` and the season view.

## What the Core Decision does and does not establish

From a full read of the redacted Core Decision (40 pages, 160 paragraphs) on 2 Oct 2026. Paragraph numbers are the decision's own.

The PDF is a scan. Pages 12–14, 19–21, 24–25 and 40 have no text layer, so text extraction skips them. They must be read as images. Redactions are burned in; no redacted text is recoverable, and none may be filled in from elsewhere.

Periods:

- 1(A) and 1(D): nine seasons, 2009/10 to 2017/18 (paras 81, 101, 113, 143). Already recorded.
- 2: the decision speaks of "the seasons to which Charge 2 relates" without listing them. The recorded 2013/14 to 2017/18 rests on para 81(b), which says the club's UEFA submissions in those seasons relied on the disputed figures.
- 3: 2015/16 to 2017/18 rests on para 81(a)(ii) in the same way.
- 1(B): four, six and one seasons for its three limbs (paras 118, 125, 132). The seasons themselves are redacted (para 101(b)–(d)). Stays `null`.
- 1(C): the seasons are redacted (para 101(e)). Footnote 12 names 2014/15 and 2017/18 only in connection with sums not paid. Stays `null`.
- 4(A)–(D): the decision states no period; the detail is in Appendices 33 and 34, which are not published. The period recorded, December 2018 to February 2023, comes from the League's charge statement of 6 Feb 2023, which gives it for the cooperation charges as a whole, not for each sub-charge.

The League's charge statement of 6 Feb 2023 (`https://www.premierleague.com/en/news/3045970`) is the primary document for the charges themselves. It lists the alleged breaches by season: financial information 2009/10 to 2017/18; manager remuneration 2009/10 to 2012/13; player remuneration 2010/11 to 2015/16; UEFA rules 2013/14 to 2017/18; Profitability and Sustainability 2015/16 to 2017/18; cooperation from December 2018 to the date of the statement. Its numbering (1 to 5) is not the Commission's (1(A)–(D), 2, 3, 4(A)–(D)); the ledger stays keyed to the Commission's.

Its manager and player remuneration rows line up with two of Charge 1(B)'s three arrangements (four and six seasons, the same rule numbers as paras 120 and 127). 1(B)'s period still stays `null`: the decision redacts those seasons, and editorial rule 5 holds even where another primary document would let them be worked out.

Dates. The decision confirms dates already in `events.json`: proceedings began February 2023 (para 1); the hearing sat on 42 days from 16 Sep to 6 Dec 2024 (page 1, para 16); 27 factual witnesses (para 27); the UEFA settlement was May 2014 (para 102); the Der Spiegel articles were November 2018 (para 103). The decision itself carries no visible date: the signature block on page 40 is redacted. It gives two further dates, neither of which is a step in a case, so neither is an event: ADUG bought 90% of the club in September 2008 (para 49), and an episode on 25 May 2013 that the Commission uses as an example (paras 88–89).

Figures the decision states exactly (now held in `data/funding.json`, season by season): £949.94 million recorded as sponsorship income from Abu Dhabi sponsors across 2009/10 to 2017/18, of which £119.25 million was paid by the sponsors and £830.69 million by ADUG (para 72, with a season-by-season table in footnote 8).

## What the UEFA, CAS and APT documents establish

Read on 2 Oct 2026, when the primary documents were added to the events that had cited press only. Every event now cites a primary document except `athletic-verdict-report`, which is a press report by nature and still cites the AP timeline, not The Athletic's own article.

- **2014 settlement.** UEFA's statement of 16 May 2014 names City among nine clubs that signed settlement agreements. The first CAS award (para 6) says the agreement was entered into on 16 May 2014 and that City did not admit a breach. The event is dated to the day on that basis. UEFA's statement does not give City's individual terms; those still rest on press.
- **Investigation opened.** UEFA's statement and the CAS award (para 9) both give 7 March 2019.
- **Referral.** The chief investigator issued the referral decision on the evening of 15 May 2019 (CAS award, paras 11 and 16). UEFA announced it on 16 May. The event is dated 15 May and says the announcement came the next day.
- **First CAS award, CAS 2019/A/6298.** City filed its appeal on 24 May 2019 against the referral decision and the refusal to pause the investigation over leaks. CAS ruled it inadmissible on 15 November 2019: a referral is not a final decision, so the appeal was premature (paras 90 and 95). An earlier version of the event said June 2019, following a press timeline.
- **UEFA's decision.** The Adjudicatory Chamber's statement of 14 February 2020 gives the findings, the two seasons (2020/21 and 2021/22) and the €30 million fine. City's statement the same day is the source for its response.
- **Second CAS award, CAS 2020/A/6785.** The media release of 13 July 2020 says most of the alleged breaches were either not established or time-barred, and sets the fine at €10 million for failing to cooperate. The published award is a 93-page scan with no text layer.
- **APT first award.** The Partial Final Award is dated 25 September 2024 and was published on 7 October 2024. Its declarations: the rules were unlawful because they excluded shareholder loans, because of pricing changes made in the amended rules, and because a club could not comment on the comparable transaction data before a decision. It also set aside two of the League's decisions on City's transactions. The League's statement of 7 October 2024 is the source for its view that most of City's challenge failed. City's statement of the same day says its claim succeeded; the event does not yet record that.
- **APT settlement.** The League and City published the same text on 8 September 2025.

Things to know when checking these links:

- `tas-cas.org` answers 200 with an HTML page for a file that does not exist. A link check must look at the content type, not the status.
- `mancity.com` refuses scripted requests with 403, and `uefa.com` times them out. Both load in a browser.
- UEFA's old `newsid=` addresses redirect. Cite the address the page redirects to.

## Visual identity

Its own, neutral. Reference-book plain: the documents are the content.

- No club colours. No sky blue, and no rival club's red either. Either one reads as taking a side.
- Do not reuse another project's design tokens.
- Colour carries meaning in exactly one place: the `finding` and `appeal` badges. Each badge also has a text label, so colour is never the only signal.
- Chosen 1 Oct 2026. The tokens live at the top of `src/styles.css`, with a dark set under `prefers-color-scheme: dark`.
  - Surfaces: paper `#f2f4ef` (the pale green-grey of ledger paper), sheet `#fbfcfa`, ink `#1a1d1b`, soft ink `#505752`, rules `#ccd3ca` and `#79827a`. There is no accent colour. Links are underlined ink.
  - The two hues mean findings and appeals wherever they appear. Plum fills the findings board and the owner-paid part of the money chart because both show findings; nothing else may use it. The chart's other part is neutral grey.
  - Finding badges are plum `#53306f`: solid for proven, tinted for proven in part, outlined for not proven, each with a full, half or empty disc.
  - Appeal badges are bronze `#6b4700`: grey outline for none, tinted for pending, solid for upheld, solid ink for overturned.
  - Every text and badge pairing is at least 6:1 contrast in both themes.
  - Type: Literata (variable, optical size) for reading and headings, italic for case names as law reports set them. Archivo (variable, slightly condensed) for dates, references, labels and controls. Both are self-hosted through `@fontsource-variable`, so the site makes no third-party requests.
  - Layout: a left margin column carries the key (date, charge reference, label) and the body carries the entry, on every view. Rows are ruled. A double rule marks the key column of the two tables and the methodology note.
- Refined 2 Oct 2026. Rules the stylesheet now follows:
  - Spacing comes from one 4px scale (`--s1` to `--s10`). Type comes from five serif sizes (`--t-*`) and three sans sizes (`--u-*`). Do not add one-off values; use a token.
  - Reading text is held to `--measure` (36rem, about 70 characters). On wide screens an entry's sources sit in a side column so the text stays at that width.
  - The masthead puts the title on the left and the open case on the right, in a panel. Panels (the open case, the press-coverage notice) are a lighter sheet with a hairline edge. There are no shadows; structure comes from rules.
  - The site has its own mark, a ledger page (`src/components/Mark.tsx`, also the favicon). It sits in the view bar and links back to the top.
  - Every control has hover, pressed and keyboard-focus states. Motion is limited to those quick state changes, a brief highlight when arriving at a linked entry, and one moment on load: the findings board fills in block by block and the chart's bars draw. All of it is switched off under `prefers-reduced-motion`.
  - Chart marks follow fixed rules: bars 14px thick, square at the baseline and rounded at the data end, a 2px gap between the two parts, no outlines. Badges, blocks and bars keep their fill when printed.
  - No gradients, no pure black or white on screen, and the only `z-index` values are `--z-bar` and `--z-skip`.
  - No label sitting above a heading. A state such as "Open" or "Today" is a `.tag` beside the text it describes.
  - No thick stripe down the side of an entry or callout. A linked entry is marked by its background alone; City's position is a labelled line under a hairline.
  - The link to an entry is a real `<a href="#id">` that also copies the address. If copying is blocked it says the link is in the address bar, which is true because following it put it there.
  - With one case selected in the timeline, rows do not repeat the case name.
  - Browser surfaces are themed: text selection, scrollbar, the browser's own chrome (`theme-color`), and print. The print stylesheet forces the light palette, drops the controls and prints each source's address after its title.
  - `public/404.html` is served on its own by GitHub Pages, so it carries its own copy of the paper and ink tokens and uses Georgia. Keep it in step by hand if the palette changes.
  - The footer says the project is independent and not affiliated with any club, league or governing body. It links to `LICENSE-DATA.md` for the terms of reuse.
- Social card, added 2 Oct 2026. `public/og.png` (1200 by 630) is what a shared link shows; `index.html` names it by its full address because link previews need one.
  - It is a still image, so it carries no findings and no status. Nothing on it may go out of date when the record changes. That is editorial rule 2 applied to an image.
  - It uses paper, ink and rules only. No plum or bronze, which mean findings and appeals.
  - Its lane rail is a motif, not data.
  - `design/social-card.html` draws it on a canvas with the site's fonts and carries its own copy of the paper and ink tokens. To redraw it, open that page through the dev server and save the image as `public/og.png`. Keep the tokens in step by hand if the palette changes.

## README and licence

- `README.md` is for a visitor to the repo. It describes what the record covers and how it is kept. It does not state where a case stands: that would be status in copy, and it would go stale. Counts that change (events, pending items) stay out of it.
- The code is MIT. The record in `data/` is CC BY 4.0, by notice in `LICENSE-DATA.md`. The headlines in `feed/updates.json` are the publishers' words and are not licensed by this project; neither are the documents the record cites.
- The README sends corrections to GitHub issues. The corrections email for the site's methodology note is still an open decision.

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
