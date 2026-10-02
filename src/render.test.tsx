// The whole page, rendered with the real data for every address a reader can
// arrive at. A data edit that breaks a join between records fails here, in the
// check, and not as a blank page on the site.
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, expect, test, vi } from "vitest";
import { App } from "./App";
import { APPEAL_LABEL, FINDING_LABEL } from "./components/Badges";
import { Ledger } from "./components/Ledger";
import { Opening } from "./components/Opening";
import { ROLE_LABEL, TYPE_LABEL } from "./components/Timeline";
import { cases, charges, events, viewOfRecord } from "./data";
import { STATUS_LABEL } from "./labels";
import { VIEWS } from "./route";

const rendered = new Map<string, string>();

// The page as it stands on arriving at a fragment. Rendering to markup runs no
// effects, so the address is the only thing the page reads from the browser.
function page(fragment: string): string {
  if (!rendered.has(fragment)) {
    vi.stubGlobal("window", { location: { hash: `#${fragment}` } });
    rendered.set(fragment, renderToStaticMarkup(<App />));
  }
  return rendered.get(fragment)!;
}

afterAll(() => vi.unstubAllGlobals());

const hasElement = (html: string, id: string) => html.includes(` id="${id}"`);

const views = VIEWS.map((view) => view.id);
// Every state of the page that holds links of its own: each view, and the
// ledger's second way of counting.
const pages = [...views, "allegations"];

test.each(views)("the %s view renders", (view) => {
  expect(hasElement(page(view), view)).toBe(true);
});

test("every record's address opens the page with that record on it", () => {
  expect(viewOfRecord.size).toBeGreaterThan(0);
  for (const id of viewOfRecord.keys()) {
    expect(hasElement(page(id), id), `#${id}`).toBe(true);
  }
});

test("every link within the page leads to something on it", () => {
  const fragments = new Set(
    pages.flatMap((p) => [...page(p).matchAll(/href="#([^"]+)"/g)].map((match) => match[1]!)),
  );
  expect(fragments.size).toBeGreaterThan(0);
  for (const fragment of fragments) {
    expect(hasElement(page(fragment), fragment), `#${fragment}`).toBe(true);
  }
});

// The latest view is left out: its headlines are the publishers' words and
// arrive unchecked, so one of them could hold any of these.
test("nothing in the record renders as a missing value", () => {
  for (const p of pages.filter((p) => p !== "latest")) {
    expect(page(p), `#${p}`).not.toMatch(/\bundefined\b|\bNaN\b|\[object Object\]/);
  }
});

// The data is cast to its types, not checked against them, so a value the
// validator allows and the app has no words for would render as nothing.
test("every value in the data has its words", () => {
  for (const event of events) expect(Object.keys(TYPE_LABEL), event.id).toContain(event.type);
  for (const charge of charges) {
    expect(Object.keys(FINDING_LABEL), charge.id).toContain(charge.finding);
    expect(Object.keys(APPEAL_LABEL), charge.id).toContain(charge.appeal);
  }
  for (const c of cases) {
    expect(Object.keys(STATUS_LABEL), c.id).toContain(c.status);
    expect(Object.keys(ROLE_LABEL), c.id).toContain(c.cityRole);
  }
});

// Editorial rule 3. The opening shows findings for open cases, the ledger for
// every case that has charges. Each must link to the entry recording City's position.
test("findings are never shown without City's position", () => {
  const withFindings = cases.filter((c) => charges.some((charge) => charge.caseId === c.id));
  expect(withFindings.length).toBeGreaterThan(0);
  const opening = renderToStaticMarkup(<Opening />);
  const ledger = renderToStaticMarkup(<Ledger target={null} />);
  for (const c of withFindings) {
    const position = `href="#${c.cityPositionEventId}"`;
    expect(ledger, `ledger, ${c.id}`).toContain(position);
    if (c.status === "open") expect(opening, `opening, ${c.id}`).toContain(position);
  }
});
