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

// The notice that an address names nothing in the record. It is the target
// when that happens, so the reader is taken to it.
export const NOT_FOUND = "not-found";

// Places on the page that are not records: the methodology note, the skip
// link's target and the money exhibit.
const ANCHORS = ["method", "content", "funding"];

const isView = (id: string): id is ViewId => VIEWS.some((v) => v.id === id);

// A view name opens that view. A record id opens the view that holds it, and an
// id that has moved opens the record it moved to. An anchor on the page leaves
// the view alone. Anything else names nothing: the view stays and the page says so.
// Ids are letters, digits and hyphens, so the fragment is compared as written. A reader
// can type anything after the #, and none of it may stop the page from rendering.
export function resolve(
  hash: string,
  previous: Route,
  viewOfRecord: ReadonlyMap<string, ViewId>,
  moved: ReadonlyMap<string, string>,
): Route {
  const typed = hash.replace(/^#/, "");
  if (typed === "") return HOME;
  if (isView(typed)) return { view: typed, target: typed };
  const id = moved.get(typed) ?? typed;
  const view = viewOfRecord.get(id);
  if (view !== undefined) return { view, target: id };
  return { view: previous.view, target: ANCHORS.includes(id) ? id : NOT_FOUND };
}
