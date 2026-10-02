// The top of the page: the name, then where each open case stands.
import type { CSSProperties } from "react";
import { groupCount } from "../allegations";
import { groupByNumber, shortRef } from "../board";
import { cx } from "../cx";
import { allegations, cases, charges, recordRunsTo } from "../data";
import { formatDate } from "../dates";
import { STATUS_LABEL } from "../labels";
import { SITE, STANDFIRST } from "../site";
import type { Case, Charge } from "../types";
import { APPEAL_LABEL, FINDING_LABEL } from "./Badges";
import { CityPosition, FindingsTally } from "./CityPosition";
import { DueNext } from "./DueNext";
import { FundingChart } from "./FundingChart";

// The charges as a board: one block each, filled by its finding, in the
// Commission's own groups. Each block opens its charge in the ledger.
function Board({ caseCharges, body }: { caseCharges: Charge[]; body: string }) {
  // The groups of the League's statement that these charges decided.
  const statement = allegations.groups.filter((group) =>
    group.chargeIds.some((id) => caseCharges.some((c) => c.id === id)));

  return (
    <figure className="board-figure">
      <figcaption>
        Findings of the {body} on the {caseCharges.length} charges. Select a charge to read it.
        {statement.length > 0 && (
          <>
            {" "}The charges cover {statement.reduce((sum, group) => sum + groupCount(group), 0)}{" "}
            alleged breaches, counted rule by season.{" "}
            <a href="#allegations">See how the two counts relate</a>
          </>
        )}
      </figcaption>
      <ol className="board">
        {groupByNumber(caseCharges).map((group) => (
          <li key={group[0]!.id} className="board-group" style={{ "--span": group.length } as CSSProperties}>
            <ol>
              {group.map((charge) => (
                <li key={charge.id}>
                  <a
                    className={cx("block", `block-${charge.finding}`, charge.appeal === "overturned" && "is-overturned")}
                    style={{ "--i": caseCharges.indexOf(charge) } as CSSProperties}
                    href={`#${charge.id}`}
                    title={charge.subject}
                    aria-label={`${charge.ref}, ${charge.subject}: ${FINDING_LABEL[charge.finding]}. ${APPEAL_LABEL[charge.appeal]}.`}
                  >
                    <span className="block-ref">{shortRef(charge)}</span>
                    <span className="block-finding">
                      <span className="finding-glyph" aria-hidden="true" />
                      {FINDING_LABEL[charge.finding]}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
      <FindingsTally caseCharges={caseCharges} />
    </figure>
  );
}

function CaseStanding({ standingCase }: { standingCase: Case }) {
  const caseCharges = charges.filter((c) => c.caseId === standingCase.id);
  const titleId = `standing-${standingCase.id}`;

  return (
    <section className="exhibit" aria-labelledby={titleId}>
      <div className="exhibit-head">
        <h2 id={titleId}><i>{standingCase.name}</i></h2>
        <span className="tag">{STATUS_LABEL[standingCase.status]}</span>
      </div>
      <p className="exhibit-lead">{standingCase.outcome}</p>
      {caseCharges.length > 0 ? (
        <>
          <Board caseCharges={caseCharges} body={standingCase.body} />
          <CityPosition ledgerCase={standingCase} caseCharges={caseCharges} />
        </>
      ) : (
        <DueNext caseId={standingCase.id} />
      )}
    </section>
  );
}

export function Opening() {
  return (
    <header className="opening">
      <h1>{SITE}</h1>
      <div className="opening-intro">
        <p className="standfirst">{STANDFIRST}</p>
        <p className="opening-meta">
          Record runs to <time dateTime={recordRunsTo}>{formatDate(recordRunsTo, "long")}</time>.{" "}
          <a href="#method">How this record is kept</a>
        </p>
      </div>

      {cases.filter((c) => c.status === "open").map((c) => (
        <CaseStanding key={c.id} standingCase={c} />
      ))}

      <FundingChart />
    </header>
  );
}
