import { cx } from "../cx";
import { pending } from "../data";
import { byDue, dueNote, formatDate } from "../dates";
import { useToday } from "../today";
import type { CaseId } from "../types";

// The next pending step in a case, linked to its entry under "What's next".
export function DueNext({ caseId }: { caseId: CaseId }) {
  const today = useToday();
  const item = byDue(pending.filter((p) => p.caseId === caseId))[0];
  if (!item) return null;
  const note = today === null ? null : dueNote(item.due, today);

  return (
    <p className="standing-meta">
      Due next: <a href={`#${item.id}`}>{item.label}</a>
      {item.due && <>, <time dateTime={item.due}>{formatDate(item.due)}</time></>}
      {note && <span className={cx(note.passed ? "due-passed" : "tag")}>{note.text}</span>}
    </p>
  );
}
