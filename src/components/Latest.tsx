import { updates } from "../data";
import { formatDate, londonDate, londonTime } from "../dates";
import { isOpinion, MARKS_ITS_COLUMNS } from "../opinion";
import type { Update } from "../types";

// updates.json is newest first, so days come out in that order too.
function byLondonDay(items: Update[]): [string, Update[]][] {
  const days = new Map<string, Update[]>();
  for (const item of items) {
    const day = londonDate(new Date(item.publishedAt));
    days.set(day, [...(days.get(day) ?? []), item]);
  }
  return [...days];
}

export function Latest() {
  const publishers = [...new Set(updates.map((u) => u.publisher))].sort();
  const publisherList = new Intl.ListFormat("en-GB", { type: "conjunction" }).format(publishers);

  return (
    <section id="latest" className="view" aria-labelledby="latest-title">
      <h2 id="latest-title">Latest coverage</h2>
      <p className="notice">
        This is press coverage, not part of the record. Headlines are gathered automatically from
        news feeds and are the publishers&rsquo; own words. Nothing here enters the record until it
        is written up as a sourced entry in the timeline.
      </p>

      {updates.length === 0 ? (
        <p className="empty">No coverage of the cases has been gathered from the feeds yet.</p>
      ) : (
        <>
          <p className="view-intro">
            {updates.length} headlines from {publisherList}. Times are UK time. Columns from{" "}
            {MARKS_ITS_COLUMNS} are tagged as opinion; the other feeds do not mark theirs.
          </p>
          {byLondonDay(updates).map(([day, items]) => (
            <section key={day} className="day" aria-labelledby={`day-${day}`}>
              <h3 id={`day-${day}`} className="day-title">
                <time dateTime={day}>{formatDate(day, "long")}</time>
              </h3>
              <ol className="rows">
                {items.map((item) => (
                  <li key={item.id} className="row row-update">
                    <div className="row-margin">
                      <time dateTime={item.publishedAt}>{londonTime(new Date(item.publishedAt))}</time>
                      <span className="row-kind">{item.publisher}</span>
                    </div>
                    <div className="row-body">
                      <a href={item.url} rel="noopener">{item.title}</a>
                      {isOpinion(item) && <> <span className="tag">Opinion</span></>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </>
      )}
    </section>
  );
}
