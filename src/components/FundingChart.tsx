// The Commission's season-by-season finding on the sponsorship money, as a
// table with a bar in each row. Every figure is in the table, so nothing
// depends on reading the bars or on hovering.
import type { CSSProperties } from "react";
import { money, total } from "../board";
import { caseById, charges, funding } from "../data";
import { AppealBadge, FindingBadge } from "./Badges";
import { PositionLine } from "./CityPosition";
import { SourceList } from "./SourceList";

export function FundingChart() {
  const charge = charges.find((c) => c.id === funding.chargeId)!;
  const positionId = caseById[charge.caseId].cityPositionEventId!;
  const { seasons } = funding;
  const largest = Math.max(...seasons.map((s) => s.recorded));
  const recorded = money(total(seasons, "recorded"));
  const bySponsors = money(total(seasons, "paidBySponsors"));
  const byOwner = money(total(seasons, "paidByOwner"));

  return (
    <section id="funding" tabIndex={-1} className="exhibit funding" aria-labelledby="funding-title">
      <div className="funding-text">
        <h2 id="funding-title">The sponsorship money</h2>
        <p className="exhibit-lead">
          Of &pound;{recorded} million recorded as fees from Abu Dhabi sponsors over{" "}
          {seasons.length} seasons, the Commission found the sponsors paid &pound;{bySponsors}{" "}
          million and the club&rsquo;s owner, ADUG, paid &pound;{byOwner} million.
        </p>
        <p className="funding-charge">
          <a href={`#${charge.id}`}>{charge.ref}</a>
          <FindingBadge finding={charge.finding} appeal={charge.appeal} />
          <AppealBadge appeal={charge.appeal} />
        </p>
        <PositionLine eventId={positionId} />
        <SourceList sources={funding.sources} />
        <p className="funding-locator">The figures are at {funding.locator} of the decision.</p>
      </div>

      <table className="funding-table">
        <caption>Fees recorded each season and who the Commission found paid them, in &pound; million</caption>
        <thead>
          <tr>
            <th scope="col">Season</th>
            <th scope="col" className="funding-bar"><span className="visually-hidden">Share paid by each</span></th>
            <th scope="col" className="num"><span className="key key-sponsors" aria-hidden="true" />Paid by sponsors</th>
            <th scope="col" className="num"><span className="key key-owner" aria-hidden="true" />Paid by ADUG</th>
            <th scope="col" className="num">Recorded</th>
          </tr>
        </thead>
        <tbody>
          {seasons.map((s, i) => (
            <tr key={s.season}>
              <th scope="row">{s.season}</th>
              <td className="funding-bar" aria-hidden="true">
                <span className="bar" style={{ "--share": s.recorded / largest, "--i": i } as CSSProperties}>
                  <span className="seg seg-sponsors" style={{ flexGrow: s.paidBySponsors }} />
                  <span className="seg seg-owner" style={{ flexGrow: s.paidByOwner }} />
                </span>
              </td>
              <td className="num">{money(s.paidBySponsors)}</td>
              <td className="num">{money(s.paidByOwner)}</td>
              <td className="num">{money(s.recorded)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className="funding-bar" />
            <td className="num">{bySponsors}</td>
            <td className="num">{byOwner}</td>
            <td className="num">{recorded}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
