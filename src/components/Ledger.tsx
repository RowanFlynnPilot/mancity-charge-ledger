import { useState } from "react";
import { groupCount } from "../allegations";
import { cx } from "../cx";
import { allegations, caseById, charges } from "../data";
import type { Case, Charge } from "../types";
import { AllegationsGrid } from "./AllegationsGrid";
import { AppealBadge, FindingBadge } from "./Badges";
import { CityPosition, FindingsTally } from "./CityPosition";
import { CopyLink } from "./CopyLink";
import { SourceList } from "./SourceList";

// The same case counted two ways: the Commission's charges, or the rules the
// League's statement cites season by season.
type Count = "charges" | "rules";

const ALLEGATIONS = "allegations";
const allegedTotal = allegations.groups.reduce((sum, group) => sum + groupCount(group), 0);

function ChargeTable({ caseCharges, target }: { caseCharges: Charge[]; target: string | null }) {
  return (
    <>
      <FindingsTally caseCharges={caseCharges} />

      <table className="ledger">
        <thead>
          <tr>
            <th scope="col">Charge</th>
            <th scope="col">Subject and what was found</th>
            <th scope="col">Finding</th>
            <th scope="col">Appeal</th>
          </tr>
        </thead>
        <tbody>
          {caseCharges.map((charge) => (
            <tr key={charge.id} id={charge.id} tabIndex={-1} className={cx(charge.id === target && "is-target")}>
              <th scope="row" className="ledger-ref">{charge.ref}</th>
              <td className="ledger-body">
                <p className="ledger-subject">{charge.subject}</p>
                {charge.period && <p className="ledger-period">Period: {charge.period}</p>}
                <p>{charge.summary}</p>
                <SourceList sources={charge.sources} />
                <p className="row-foot"><CopyLink id={charge.id} /></p>
              </td>
              <td className="ledger-finding">
                <FindingBadge finding={charge.finding} appeal={charge.appeal} />
              </td>
              <td className="ledger-appeal"><AppealBadge appeal={charge.appeal} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function CaseLedger({ ledgerCase, target }: { ledgerCase: Case; target: string | null }) {
  const caseCharges = charges.filter((c) => c.caseId === ledgerCase.id);
  // The League's statement belongs to the case whose charges it is matched to.
  const hasStatement = allegations.groups.some((group) =>
    group.chargeIds.some((id) => caseCharges.some((c) => c.id === id)));

  const [count, setCount] = useState<Count>("charges");

  // A link to a charge, or to the statement, must land on the count that shows it.
  const [seenTarget, setSeenTarget] = useState<string | null>(null);
  if (target !== seenTarget) {
    setSeenTarget(target);
    if (target === ALLEGATIONS && hasStatement) setCount("rules");
    else if (caseCharges.some((c) => c.id === target)) setCount("charges");
  }

  return (
    <>
      <h3 className="case-title"><i>{ledgerCase.name}</i></h3>
      <p className="view-intro">
        The findings below are those of the {ledgerCase.body}, set out charge by charge as its
        published decision numbers them. This record reports them and links to the document.
        It makes no findings of its own.
      </p>

      <CityPosition ledgerCase={ledgerCase} caseCharges={caseCharges} />

      {hasStatement && (
        <div className="toolbar count-switch">
          <p className="toolbar-status">The same case, counted two ways.</p>
          <div className="segmented" role="group" aria-label="Count by">
            <button type="button" aria-pressed={count === "charges"} onClick={() => setCount("charges")}>
              The Commission&rsquo;s {caseCharges.length} charges
            </button>
            <button type="button" aria-pressed={count === "rules"} onClick={() => setCount("rules")}>
              The League&rsquo;s {allegedTotal} alleged breaches
            </button>
          </div>
        </div>
      )}

      {count === "charges"
        ? <ChargeTable caseCharges={caseCharges} target={target} />
        : <AllegationsGrid caseCharges={caseCharges} body={ledgerCase.body} />}
    </>
  );
}

export function Ledger({ target }: { target: string | null }) {
  const caseIds = [...new Set(charges.map((c) => c.caseId))];
  return (
    <section id="ledger" className="view" aria-labelledby="ledger-title">
      <h2 id="ledger-title">Charge ledger</h2>
      {caseIds.map((id) => (
        <CaseLedger key={id} ledgerCase={caseById[id]} target={target} />
      ))}
    </section>
  );
}
