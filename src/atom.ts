// The record's own feed: one Atom entry for each entry in the timeline, newest
// first, so a reader can follow the record without visiting it.
import type { CaseEvent, LedgerDate } from "./types";

export interface FeedDetails {
  title: string;
  subtitle: string;
  author: string;
  address: string; // where the site is published, ending in a slash
  file: string; // the feed's own file name there
}

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Atom wants a full timestamp. The record holds dates, some to the month only;
// a month is given as its first day.
export function atomDate(date: LedgerDate): string {
  return `${date.length === 7 ? `${date}-01` : date}T00:00:00Z`;
}

function entry(event: CaseEvent, cases: string[], address: string): string {
  const link = `${address}#${event.id}`;
  return [
    "  <entry>",
    `    <id>${escape(link)}</id>`,
    `    <title>${escape(event.headline)}</title>`,
    `    <updated>${atomDate(event.date)}</updated>`,
    `    <link rel="alternate" type="text/html" href="${escape(link)}"/>`,
    ...event.sources.map((source) =>
      `    <link rel="related" href="${escape(source.url)}" title="${escape(`${source.title}, ${source.publisher}`)}"/>`),
    ...cases.map((name) => `    <category term="${escape(name)}"/>`),
    `    <summary>${escape(event.summary)}</summary>`,
    "  </entry>",
  ].join("\n");
}

// events are in the record's order, oldest first. caseName gives a case's name from its id.
export function atomFeed(details: FeedDetails, events: CaseEvent[], caseName: (id: CaseEvent["caseIds"][number]) => string): string {
  const newestFirst = [...events].reverse();
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <id>${escape(details.address)}</id>`,
    `  <title>${escape(details.title)}</title>`,
    `  <subtitle>${escape(details.subtitle)}</subtitle>`,
    `  <updated>${atomDate(newestFirst[0]!.date)}</updated>`,
    `  <link rel="self" type="application/atom+xml" href="${escape(details.address + details.file)}"/>`,
    `  <link rel="alternate" type="text/html" href="${escape(details.address)}"/>`,
    `  <author><name>${escape(details.author)}</name></author>`,
    ...newestFirst.map((event) => entry(event, event.caseIds.map(caseName), details.address)),
    "</feed>",
    "",
  ].join("\n");
}
