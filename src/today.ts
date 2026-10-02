import { useSyncExternalStore } from "react";
import { londonDate } from "./dates";

const never = () => () => {};
const now = () => londonDate(new Date());
const unknown = () => null;

// Today's date in London, or null where it cannot be known: in the page the
// build renders, and while the app takes that page over. A date worked out at
// build time would be wrong by the time anyone read it.
export function useToday(): string | null {
  return useSyncExternalStore(never, now, unknown);
}
