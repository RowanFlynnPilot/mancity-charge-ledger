import { cx } from "../cx";
import { caseById, charges, eventById } from "../data";
import { formatDate } from "../dates";
import type { AppealState, Case, Charge, Finding } from "../types";
import { APPEAL_LABEL, AppealBadge, FINDING_LABEL, FindingBadge } from "./Badges";
import { CopyLink } from "./CopyLink";
import { DueNext } from "./DueNext";
import { SourceList } from "./SourceList";

const FINDINGS = Object.keys(FINDING_LABEL) as Finding[];
const APPEAL_STATES = Object.keys(APPEAL_LABEL) as AppealState[];

function count<T>(items: T[], matches: (item: T) => boolean): number {
  return items.filter(matches).length;
}

// City's response and the appeal state. Shown wherever the findings are.
function CityPosition({ ledgerCase, caseCharges }: { ledgerCase: Case; caseCharges: Charge[] }) {
  const position = eventById.get(ledgerCase.cityPositionEventId!)!;

  return (
    <dl className="standing">
      <div>
        <dt>City&rsquo;s position</dt>
        <dd>
          <p className="standing-lead">{position.headline}</p>
          <p>{position.summary}</p>
          <p className="standing-meta">
            Recorded <time dateTime={position.date}>{formatDate(position.date)}</time>.{" "}
            <a href={`#${position.id}`}>See this entry in the timeline</a>
          </p>
        </dd>
      </div>
      <div>
        <dt>Appeal</dt>
        <dd>
          <ul className="tally">
            {APPEAL_STATES.map((state) => {
              const n = count(caseCharges, (c) => c.appeal === state);
              return n > 0 && (
                <li key={state}>
                  <AppealBadge appeal={state} /> {n} of {caseCharges.length} charges
                </li>
              );
            })}
          </ul>
          <DueNext caseId={ledgerCase.id} />
        </dd>
      </div>
    </dl>
  );
}

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

      <ul className="tally tally-findings" aria-label="Findings">
        {FINDINGS.map((finding) => (
          <li key={finding}>
            <FindingBadge finding={finding} appeal="none" />{" "}
            {count(caseCharges, (c) => c.finding === finding)}
          </li>
        ))}
      </ul>

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
