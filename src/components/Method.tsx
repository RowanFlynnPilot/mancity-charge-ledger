import { ADDRESS, ATOM_FILE, EDIT_HISTORY, LICENCE } from "../site";

// The record's files, as the build publishes them under data/.
const FILES = [
  ["cases", "the cases"],
  ["events", "the timeline"],
  ["charges", "the charges"],
  ["pending", "what is due"],
  ["allegations", "the League’s statement"],
  ["funding", "the funding figures"],
  ["seasons", "the season table"],
] as const;

export function Method() {
  return (
    <section id="method" tabIndex={-1} className="method" aria-labelledby="method-title">
      <h2 id="method-title">How this record is kept</h2>
      <dl className="standing">
        <div>
          <dt>Sources</dt>
          <dd>
            <p>
              Every entry links to where it comes from. A primary document is a decision, award,
              rule or statement published by a regulator, a tribunal, a court or the club. A press
              report is journalism about one. Each source is labelled as one or the other, and the
              charge ledger cites primary documents only.
            </p>
          </dd>
        </div>
        <div>
          <dt>Findings</dt>
          <dd>
            <p>
              This record makes no findings of its own. Where something was found, the entry says
              who found it and links to the document. Wherever findings against the club appear,
              so do the club&rsquo;s response and the state of any appeal.
            </p>
          </dd>
        </div>
        <div>
          <dt>Charges</dt>
          <dd>
            <p>
              The ledger follows the Commission&rsquo;s own numbering of the charges, not the
              totals used in press coverage. Names removed from a published decision stay removed
              here; they are not filled in from other reporting.
            </p>
          </dd>
        </div>
        <div>
          <dt>Dates</dt>
          <dd>
            <p>
              A date is given to the day only where a source establishes the day. Otherwise it is
              given to the month.
            </p>
          </dd>
        </div>
        <div>
          <dt>Coverage</dt>
          <dd>
            <p>
              The latest coverage list is gathered automatically from news feeds. It is not part
              of the record and is not checked entry by entry.
            </p>
          </dd>
        </div>
        <div>
          <dt>Reuse</dt>
          <dd>
            <p>
              The record may be reused with credit, under{" "}
              <a href={LICENCE} rel="noopener">CC BY 4.0</a>. Its files are published as JSON:{" "}
              {FILES.map(([file, label], i) => (
                <span key={file}>
                  {i > 0 && ", "}
                  <a href={`${ADDRESS}data/${file}.json`}>{label}</a>
                </span>
              ))}
              . Entries are also published as <a href={ADDRESS + ATOM_FILE}>an Atom feed</a>.
            </p>
          </dd>
        </div>
        <div>
          <dt>Maintainer</dt>
          <dd>
            <p>
              Rowan Flynn keeps this record as a personal project. Every change to it is logged
              in public: <a href={EDIT_HISTORY} rel="noopener">see the edit history</a>.
            </p>
          </dd>
        </div>
      </dl>
    </section>
  );
}
