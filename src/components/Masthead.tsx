import { cases, recordRunsTo } from "../data";
import { formatDate } from "../dates";
import { DueNext } from "./DueNext";

export function Masthead() {
  const open = cases.filter((c) => c.status === "open");

  return (
    <header className="masthead">
      <div className="masthead-title">
        <h1>The Charge Ledger</h1>
        <p className="standfirst">
          A sourced record of the financial-rules cases involving Manchester City: what was alleged,
          what was decided and by whom, and what happens next.
        </p>
        <p className="masthead-meta">
          Record runs to <time dateTime={recordRunsTo}>{formatDate(recordRunsTo, "long")}</time>.{" "}
          <a href="#method">How this record is kept</a>
        </p>
      </div>

      {open.length > 0 && (
        <div className="masthead-status">
          {open.map((c) => (
            <section key={c.id} className="status" aria-labelledby={`status-${c.id}`}>
              <p className="status-label">Open case</p>
              <h2 id={`status-${c.id}`} className="status-case"><i>{c.name}</i></h2>
              <p>{c.outcome}</p>
              <DueNext caseId={c.id} />
            </section>
          ))}
        </div>
      )}
    </header>
  );
}
