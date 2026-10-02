import { cx } from "../cx";
import { eventById, seasons } from "../data";
import { ordinal } from "../ordinal";
import { SourceList } from "./SourceList";

// The sourced entry that says which seasons the charges cover.
const CHARGES_EVENT = "pl-charges";

export function Seasons({ target }: { target: string | null }) {
  const charged = eventById.get(CHARGES_EVENT)!;
  const first = seasons[0]!;
  const last = seasons[seasons.length - 1]!;

  return (
    <section id="seasons" className="view" aria-labelledby="seasons-title">
      <h2 id="seasons-title">Seasons</h2>
      <p className="view-intro">
        <a href={`#${charged.id}`}>The Premier League&rsquo;s charges</a> cover the {seasons.length}{" "}
        seasons from {first.label} to {last.label}. For each one, this shows where City finished
        and which clubs finished first and second, taken from the League&rsquo;s own final table.
        Results are given as those tables record them.
      </p>

      <table className="seasons">
        <thead>
          <tr>
            <th scope="col">Season</th>
            <th scope="col">City finished</th>
            <th scope="col">Champion</th>
            <th scope="col">Runner-up</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {seasons.map((season) => (
            <tr key={season.id} id={season.id} tabIndex={-1} className={cx(season.id === target && "is-target")}>
              <th scope="row" className="seasons-key">{season.label}</th>
              <td className="seasons-position" data-label="City finished">{ordinal(season.cityPosition)}</td>
              <td className="seasons-club" data-label="Champion">{season.champion}</td>
              <td className="seasons-club" data-label="Runner-up">{season.runnerUp}</td>
              <td className="seasons-source"><SourceList sources={season.sources} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
