// The URL fragment picks the view and, optionally, one entry inside it.

export const VIEWS = [
  { id: "timeline", label: "Timeline" },
  { id: "ledger", label: "Charge ledger" },
  { id: "seasons", label: "Seasons" },
  { id: "next", label: "What’s next" },
  { id: "latest", label: "Latest" },
] as const;

export type ViewId = (typeof VIEWS)[number]["id"];

export interface Route {
  view: ViewId;
  target: string | null; // element to scroll to
}

export const HOME: Route = { view: "timeline", target: null };

const isView = (id: string): id is ViewId => VIEWS.some((v) => v.id === id);

// A view name opens that view. A record id opens the view that holds it.
// Anything else (#method, #content) is an anchor on the page and leaves the view alone.
// Ids are letters, digits and hyphens, so the fragment is compared as written. A reader
// can type anything after the #, and none of it may stop the page from rendering.
export function resolve(hash: string, previous: Route, viewOfRecord: ReadonlyMap<string, ViewId>): Route {
  const id = hash.replace(/^#/, "");
  if (id === "") return HOME;
  if (isView(id)) return { view: id, target: id };
  return { view: viewOfRecord.get(id) ?? previous.view, target: id };
}
