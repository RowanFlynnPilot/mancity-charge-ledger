// What the build writes besides the app itself: the page as markup, so the
// record is in the HTML that is served, and the record's Atom feed.
// scripts/write-static.mjs calls these once the site is built.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { atomFeed } from "./atom";
import { caseById, events } from "./data";
import { ADDRESS, ATOM_FILE, KEEPER, SITE, STANDFIRST } from "./site";

// The same tree main.tsx hands to the browser, so the app can take the markup over.
export function page(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

export function feed(): string {
  return atomFeed(
    { title: SITE, subtitle: STANDFIRST, author: KEEPER, address: ADDRESS, file: ATOM_FILE },
    events,
    (id) => caseById[id].name,
  );
}
