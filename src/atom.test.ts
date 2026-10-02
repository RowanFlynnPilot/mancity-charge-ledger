import { expect, test } from "vitest";
import { atomDate, atomFeed, type FeedDetails } from "./atom";
import { caseById, events } from "./data";
import type { CaseEvent } from "./types";

const details: FeedDetails = {
  title: "The Record", subtitle: "A test", author: "A. Keeper",
  address: "https://example.com/record/", file: "atom.xml",
};

const event = (id: string, date: string, headline = "Headline"): CaseEvent => ({
  id, date, headline, caseIds: ["pl-2023"], type: "ruling", summary: "Summary.",
  sources: [{ title: "Decision", publisher: "League", url: "https://example.com/d?a=1&b=2", kind: "primary" }],
});

const caseName = () => "The case";

test("a date becomes a timestamp, and a month its first day", () => {
  expect(atomDate("2026-09-29")).toBe("2026-09-29T00:00:00Z");
  expect(atomDate("2018-11")).toBe("2018-11-01T00:00:00Z");
});

test("entries run newest first and the feed is dated by the newest", () => {
  const feed = atomFeed(details, [event("first", "2019-03-07"), event("second", "2020-02-14")], caseName);
  expect(feed.indexOf("#second")).toBeLessThan(feed.indexOf("#first"));
  expect(feed).toContain("<feed xmlns=\"http://www.w3.org/2005/Atom\">\n  <id>https://example.com/record/</id>");
  expect(feed).toContain("  <updated>2020-02-14T00:00:00Z</updated>\n  <link rel=\"self\"");
});

test("an entry links to itself on the site and to its sources", () => {
  const feed = atomFeed(details, [event("decision", "2026-09-29")], caseName);
  expect(feed).toContain("<id>https://example.com/record/#decision</id>");
  expect(feed).toContain('<link rel="alternate" type="text/html" href="https://example.com/record/#decision"/>');
  expect(feed).toContain('<link rel="related" href="https://example.com/d?a=1&amp;b=2" title="Decision, League"/>');
  expect(feed).toContain('<category term="The case"/>');
});

test("text is escaped", () => {
  const feed = atomFeed(details, [event("a", "2026-09-29", 'City & League: "sham" <deal>')], caseName);
  expect(feed).toContain("<title>City &amp; League: &quot;sham&quot; &lt;deal&gt;</title>");
});

test("the real record makes one entry for each event", () => {
  const feed = atomFeed(details, events, (id) => caseById[id].name);
  expect(feed.match(/<entry>/g)).toHaveLength(events.length);
  expect(feed.match(/<\/entry>/g)).toHaveLength(events.length);
  expect(feed.endsWith("</feed>\n")).toBe(true);
  // Every ampersand left in the feed begins one of the five entities used.
  expect(feed).not.toMatch(/&(?!amp;|lt;|gt;|quot;)/);
});
