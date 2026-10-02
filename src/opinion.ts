// Which headlines in the press feed are opinion, as far as a headline can show it.
import type { Update } from "./types";

// The Guardian ends a column's headline with a bar and the writer's name
// ("… punishment must be severe | Jonathan Wilson"), or with "Editorial" or
// "Letters". Its newsletter begins with a bar instead ("Football Daily | …"), and
// what follows is a sentence, not a name, so it does not match.
const SIGNED = / \| (?:Editorial|Letters|\p{Lu}[\p{L}'’.-]*(?: [\p{L}'’.-]+){0,2} \p{Lu}[\p{L}'’.-]*)$/u;

// The one publisher that marks its columns in a way a feed carries. A column
// from another publisher is not recognised, and the latest view says so.
export const MARKS_ITS_COLUMNS = "The Guardian";

export function isOpinion(update: Pick<Update, "publisher" | "title">): boolean {
  return update.publisher === MARKS_ITS_COLUMNS && SIGNED.test(update.title);
}
