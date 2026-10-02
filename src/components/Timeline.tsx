import { useState, type CSSProperties } from "react";
import { cx } from "../cx";
import { caseById, cases, eventById, events, pending } from "../data";
import { formatDate } from "../dates";
import { STATUS_LABEL } from "../labels";
import { buildRows, railCells, type Cell } from "../rail";
import type { Case, CaseEvent, CaseId, EventType } from "../types";
import { PositionLine } from "./CityPosition";
import { CopyLink } from "./CopyLink";
import { SourceList } from "./SourceList";

export const TYPE_LABEL: Record<EventType, string> = {
  report: "Report",
  investigation: "Investigation",
  charge: "Charge",
  hearing: "Hearing",
  ruling: "Ruling",
  sanction: "Sanction",
  settlement: "Settlement",
  statement: "Statement",
  "rule-change": "Rule change",
  filing: "Filing",
};

export const ROLE_LABEL: Record<Case["cityRole"], string> = {
  respondent: "City is the respondent",
  claimant: "City is the claimant",
};

// Where a ruling or sanction is shown, City's recorded position goes with it.
function cityPositionIds(event: CaseEvent): string[] {
  if (event.type !== "ruling" && event.type !== "sanction") return [];
  return event.caseIds
    .map((id) => caseById[id].cityPositionEventId)
    .filter((id): id is string => id !== null && id !== event.id);
}

function Rail({ cells, lanes }: { cells: Cell[]; lanes: Case[] }) {
  const dots = cells.flatMap((cell, lane) => (cell.dot ? [lane] : []));
  return (
    <div className="rail" aria-hidden="true">
      {cells.map((cell, lane) => (
        <span
          key={lanes[lane]!.id}
          className={cx("lane", cell.above && "lane-above", cell.below && "lane-below",
            cell.ongoing && "lane-ongoing")}
        >
          {cell.dot && <span className={`dot dot-${lanes[lane]!.cityRole}`} />}
        </span>
      ))}
      {dots.length > 1 && (
        <span
          className="tie"
          style={{ "--from": dots[0], "--to": dots[dots.length - 1] } as CSSProperties}
        />
      )}
    </div>
  );
}

// Shows which lane of the rail belongs to a case.
function LaneKey({ lane, role }: { lane: number; role: Case["cityRole"] }) {
  return (
    <span className="lane-key" aria-hidden="true">
      {cases.map((c, i) => (
        <span key={c.id} className={cx("lane-key-tick", i === lane && `lane-key-on dot-${role}`)} />
      ))}
    </span>
  );
}

// With one case selected, every row belongs to it, so the rows do not repeat its name.
function EventRow({ event, cells, lanes, isTarget }: {
  event: CaseEvent; cells: Cell[]; lanes: Case[]; isTarget: boolean;
}) {
  const nameCases = lanes.length > 1;
  return (
    <li id={event.id} tabIndex={-1} className={cx("row row-event", isTarget && "is-target")}>
      <Rail cells={cells} lanes={lanes} />
      <div className="row-margin">
        <time dateTime={event.date}>{formatDate(event.date)}</time>
        <span className="row-kind">{TYPE_LABEL[event.type]}</span>
      </div>
      <article className="row-body row-split">
        <div className="row-main">
          <h3>{event.headline}</h3>
          <p>{event.summary}</p>
          {cityPositionIds(event).map((id) => <PositionLine key={id} eventId={id} />)}
        </div>
        <div className="row-aside">
          <SourceList sources={event.sources} />
          <p className="row-foot">
            {nameCases && (
              <span className="case-names">{event.caseIds.map((id) => caseById[id].name).join("; ")}</span>
            )}
            <CopyLink id={event.id} />
          </p>
        </div>
      </article>
    </li>
  );
}

export function Timeline({ target }: { target: string | null }) {
  const [caseId, setCaseId] = useState<CaseId | null>(null);
  const [newestFirst, setNewestFirst] = useState(true);

  // A linked entry must be on screen: drop the filter if it would hide it.
  const [seenTarget, setSeenTarget] = useState<string | null>(null);
  if (target !== seenTarget) {
    setSeenTarget(target);
    const linked = target === null ? undefined : eventById.get(target);
    if (linked && caseId !== null && !linked.caseIds.includes(caseId)) setCaseId(null);
  }

  const lanes = caseId === null ? cases : [caseById[caseId]];
  const shown = caseId === null ? events : events.filter((e) => e.caseIds.includes(caseId));
  const rows = buildRows(newestFirst ? [...shown].reverse() : shown, lanes, newestFirst);
  const cells = railCells(rows, lanes);
  const openLanes = lanes.filter((c) => c.status === "open");

  return (
    <section id="timeline" className="view" aria-labelledby="timeline-title">
      <h2 id="timeline-title">Timeline</h2>

      <div className="cases" role="group" aria-label="Show one case">
        {cases.map((c, lane) => (
          <button
            key={c.id}
            type="button"
            className="case"
            aria-pressed={caseId === c.id}
            onClick={() => setCaseId(caseId === c.id ? null : c.id)}
          >
            <LaneKey lane={lane} role={c.cityRole} />
            <span className="case-name">{c.name}</span>
            <span className="case-meta">
              {STATUS_LABEL[c.status]}. {ROLE_LABEL[c.cityRole]}.
            </span>
            <span className="case-meta">{c.body}</span>
            <span className="case-outcome">{c.outcome}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <p className="toolbar-status" role="status">
          {caseId === null
            ? `${shown.length} entries across ${cases.length} cases. Select a case to show it alone.`
            : `${shown.length} entries in this case.`}{" "}
          {caseId !== null && (
            <button type="button" className="text-button" onClick={() => setCaseId(null)}>
              Show all cases
            </button>
          )}
        </p>
        <div className="segmented" role="group" aria-label="Order">
          <button type="button" aria-pressed={newestFirst} onClick={() => setNewestFirst(true)}>
            Newest first
          </button>
          <button type="button" aria-pressed={!newestFirst} onClick={() => setNewestFirst(false)}>
            Oldest first
          </button>
        </div>
      </div>

      <ol className="rows rows-rail" style={{ "--lanes": lanes.length } as CSSProperties}>
        {rows.map((row, i) => {
          if (row.kind === "event") {
            return (
              <EventRow
                key={row.event.id}
                event={row.event}
                cells={cells[i]!}
                lanes={lanes}
                isTarget={row.event.id === target}
              />
            );
          }
          if (row.kind === "year") {
            return (
              <li key={row.year} className="row row-year">
                <Rail cells={cells[i]!} lanes={lanes} />
                <div className="row-margin">{row.year}</div>
              </li>
            );
          }
          return (
            <li key="ongoing" className="row row-ongoing">
              <Rail cells={cells[i]!} lanes={lanes} />
              <div className="row-margin">Still open</div>
              <div className="row-body">
                {openLanes.map((c) => {
                  const due = pending.filter((p) => p.caseId === c.id).length;
                  return (
                    <p key={c.id}>
                      <i>{c.name}</i> has not concluded.{" "}
                      {due > 0 && (
                        <a href="#next">
                          {due === 1 ? "1 step is still to come" : `${due} steps are still to come`}
                        </a>
                      )}
                    </p>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
