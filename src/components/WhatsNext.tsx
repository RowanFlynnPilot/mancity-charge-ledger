import { cx } from "../cx";
import { caseById, pending } from "../data";
import { byDue, dueNote, formatDate, londonDate } from "../dates";
import { CopyLink } from "./CopyLink";
import { SourceList } from "./SourceList";

export function WhatsNext({ target }: { target: string | null }) {
  const today = londonDate(new Date());

  return (
    <section id="next" className="view" aria-labelledby="next-title">
      <h2 id="next-title">What&rsquo;s next</h2>
      <p className="view-intro">
        Steps that are due but have not happened. When one happens it becomes a sourced entry in
        the timeline and leaves this list.
      </p>

      {pending.length === 0 && <p className="empty">Nothing is recorded as due.</p>}

      <ol className="rows">
        {byDue(pending).map((item) => {
          const note = dueNote(item.due, today);
          return (
            <li key={item.id} id={item.id} tabIndex={-1} className={cx("row", item.id === target && "is-target")}>
              <div className="row-margin">
                {item.due
                  ? <time dateTime={item.due}>{formatDate(item.due)}</time>
                  : <span className="row-kind">No date published</span>}
                {note && <span className={cx("row-kind", note.passed && "due-passed")}>{note.text}</span>}
              </div>
              <article className="row-body row-split">
                <div className="row-main">
                  <h3>{item.label}</h3>
                  <p>{item.detail}</p>
                </div>
                <div className="row-aside">
                  <SourceList sources={item.sources} />
                  <p className="row-foot">
                    <span className="case-names">{caseById[item.caseId].name}</span>
                    <CopyLink id={item.id} />
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
