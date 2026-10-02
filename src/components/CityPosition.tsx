// City's recorded position, the appeal state and the tally of findings.
// Wherever findings are shown, these go with them.
import { eventById } from "../data";
import { formatDate } from "../dates";
import type { AppealState, Case, Charge, Finding } from "../types";
import { APPEAL_LABEL, AppealBadge, FINDING_LABEL, FindingBadge } from "./Badges";
import { DueNext } from "./DueNext";

const FINDINGS = Object.keys(FINDING_LABEL) as Finding[];
const APPEAL_STATES = Object.keys(APPEAL_LABEL) as AppealState[];

function count<T>(items: T[], matches: (item: T) => boolean): number {
  return items.filter(matches).length;
}

export function CityPosition({ ledgerCase, caseCharges }: { ledgerCase: Case; caseCharges: Charge[] }) {
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

// How many charges met each finding. Doubles as the key to the findings board.
export function FindingsTally({ caseCharges }: { caseCharges: Charge[] }) {
  return (
    <ul className="tally tally-findings" aria-label="Findings">
      {FINDINGS.map((finding) => (
        <li key={finding}>
          <FindingBadge finding={finding} appeal="none" />{" "}
          {count(caseCharges, (c) => c.finding === finding)}
        </li>
      ))}
    </ul>
  );
}

// One line pointing at the entry that records City's position.
export function PositionLine({ eventId }: { eventId: string }) {
  const position = eventById.get(eventId)!;
  return (
    <p className="position-line">
      <span className="position-label">City&rsquo;s position</span>{" "}
      <a href={`#${position.id}`}>{position.headline}</a>
    </p>
  );
}
