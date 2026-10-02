// The other way to count the case: the League's charge statement, rule by
// season, set against the Commission's charges that decided each group.
import type { CSSProperties } from "react";
import { groupCount, seasonCount, seasonsCited } from "../allegations";
import { shortRef } from "../board";
import { cx } from "../cx";
import { allegations } from "../data";
import type { Charge, Source } from "../types";
import { FINDING_LABEL } from "./Badges";
import { SourceList } from "./SourceList";

// A charge as a small badge: its finding by shape and colour, its reference in words.
function ChargeChip({ charge }: { charge: Charge }) {
  const label = `${charge.ref}: ${FINDING_LABEL[charge.finding]}`;
  return (
    <a
      className={cx("badge finding chip", `finding-${charge.finding}`, charge.appeal === "overturned" && "is-overturned")}
      href={`#${charge.id}`}
      title={label}
      aria-label={label}
    >
      <span className="finding-glyph" aria-hidden="true" />
      {shortRef(charge)}
    </a>
  );
}

// The document every charge cites: the decision itself.
function decisionSource(caseCharges: Charge[]): Source {
  return caseCharges[0]!.sources.find((source) =>
    caseCharges.every((charge) => charge.sources.some((s) => s.url === source.url)))!;
}

export function AllegationsGrid({ caseCharges, body }: { caseCharges: Charge[]; body: string }) {
  const { groups, pressTally, sources } = allegations;
  const columns = seasonsCited(groups);
  const total = groups.reduce((sum, group) => sum + groupCount(group), 0);
  const chargeById = new Map(caseCharges.map((charge) => [charge.id, charge]));
  const notes = groups.flatMap((group) => group.seasons.filter((s) => s.note !== null));

  return (
    <section id="allegations" tabIndex={-1} className="allegations" aria-labelledby="allegations-title">
      <h3 id="allegations-title" className="case-title">The League&rsquo;s statement, rule by season</h3>
      <p>
        The League&rsquo;s charge statement lists the rules it alleged were broken, season by
        season. Counting each rule once for every season it is cited gives {total} alleged
        breaches. The {body} decided them as {caseCharges.length} charges. Its decision puts the
        individual breaches at well over 100 and gives no exact figure.
      </p>
      <p>
        Press reports have often put the number at {pressTally.count}. The League&rsquo;s statement
        gives no total, and the figure depends on how the rules are counted.
      </p>

      <table className="grid" style={{ "--cols": columns.length } as CSSProperties}>
        <caption>Rules cited in the League&rsquo;s statement, by season</caption>
        <thead>
          <tr>
            <th scope="col" className="grid-subject">What the rules concern, and the charges that decided it</th>
            {columns.map((season) => (
              <th key={season} scope="col">
                <abbr title={season}>
                  {season.slice(2, 4)}<span className="grid-season-end">{season.slice(4)}</span>
                </abbr>
              </th>
            ))}
            <th scope="col" className="grid-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const cited = new Map(group.seasons.map((s) => [s.season, s]));
            return (
              <tr key={group.id}>
                <th scope="row" className="grid-subject">
                  <span className="grid-name">{group.subject}</span>
                  <span className="grid-charges">
                    {group.chargeIds.map((id) => <ChargeChip key={id} charge={chargeById.get(id)!} />)}
                  </span>
                </th>
                {columns.map((season) => {
                  const entry = cited.get(season);
                  return (
                    <td key={season} title={entry && `${season}: ${entry.rules.join(", ")}`}>
                      {entry
                        ? <span className="grid-tile">{seasonCount(entry)}</span>
                        : <span className="visually-hidden">None</span>}
                    </td>
                  );
                })}
                <td className="grid-total">{groupCount(group)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="grid-subject">All rules cited</th>
            {columns.map((season) => (
              <td key={season}>
                {groups.reduce((sum, group) => {
                  const entry = group.seasons.find((s) => s.season === season);
                  return sum + (entry ? seasonCount(entry) : 0);
                }, 0)}
              </td>
            ))}
            <td className="grid-total">{total}</td>
          </tr>
        </tfoot>
      </table>

      {notes.map((s) => (
        <p key={s.season} className="grid-note">{s.season}: {s.note}</p>
      ))}
      <p className="grid-note">
        Each row is matched to the Commission&rsquo;s charges by the rule numbers the statement and
        the decision share. Neither document sets out that match, and nothing published shows which
        individual breaches fall under which finding.
      </p>

      <details className="grid-rules">
        <summary>The rules cited, season by season</summary>
        {groups.map((group) => (
          <dl key={group.id}>
            <dt className="grid-rules-group">{group.subject}</dt>
            {group.seasons.map((s) => (
              <dd key={s.season}>
                <span className="grid-rules-season">{s.season}</span> {s.rules.join(", ")}
              </dd>
            ))}
          </dl>
        ))}
      </details>

      <SourceList sources={[...sources, decisionSource(caseCharges), ...pressTally.sources]} />
    </section>
  );
}
