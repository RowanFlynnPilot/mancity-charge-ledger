import { cx } from "../cx";
import { caseById, charges } from "../data";
import type { Case } from "../types";
import { AppealBadge, FindingBadge } from "./Badges";
import { CityPosition, FindingsTally } from "./CityPosition";
import { CopyLink } from "./CopyLink";
import { SourceList } from "./SourceList";

function CaseLedger({ ledgerCase, target }: { ledgerCase: Case; target: string | null }) {
  const caseCharges = charges.filter((c) => c.caseId === ledgerCase.id);

  return (
    <>
      <h3 className="case-title"><i>{ledgerCase.name}</i></h3>
      <p className="view-intro">
        The findings below are those of the {ledgerCase.body}, set out charge by charge as its
        published decision numbers them. This record reports them and links to the document.
        It makes no findings of its own.
      </p>

      <CityPosition ledgerCase={ledgerCase} caseCharges={caseCharges} />

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
