import { cases, recordRunsTo } from "../data";
import { formatDate } from "../dates";
import { DueNext } from "./DueNext";

export function Masthead() {
  return (
    <header className="masthead">
      <h1>The Charge Ledger</h1>
      <p className="standfirst">
        A sourced record of the financial-rules cases involving Manchester City: what was alleged,
        what was decided and by whom, and what happens next.
      </p>

      <dl className="standing">
        {cases.filter((c) => c.status === "open").map((c) => (
          <div key={c.id}>
            <dt>Open case</dt>
            <dd>
              <p className="standing-lead"><i>{c.name}</i></p>
              <p>{c.outcome}</p>
              <DueNext caseId={c.id} />
            </dd>
          </div>
        ))}
        <div>
          <dt>Record runs to</dt>
          <dd>
            <p>
              <time dateTime={recordRunsTo}>{formatDate(recordRunsTo, "long")}</time>.{" "}
              <a href="#method">How this record is kept</a>
            </p>
          </dd>
        </div>
      </dl>
    </header>
  );
}
