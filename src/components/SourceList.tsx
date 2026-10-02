import { archiveOf } from "../data";
import type { Source, SourceKind } from "../types";

const KIND_LABEL: Record<SourceKind, string> = {
  primary: "Primary document",
  press: "Press report",
};

const isPdf = (url: string) => new URL(url).pathname.toLowerCase().endsWith(".pdf");

export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ul className="sources" aria-label="Sources">
      {sources.map((source) => {
        // A copy held by the Internet Archive, for when the page itself has moved or gone.
        const archive = archiveOf.get(source.url);
        return (
          <li key={source.url}>
            <span className={`source-kind source-kind-${source.kind}`}>{KIND_LABEL[source.kind]}</span>
            <span>
              <a href={source.url} rel="noopener">{source.title}</a>
              <span className="source-publisher">
                {isPdf(source.url) && " (PDF)"}, {source.publisher}
                {/* A non-breaking space, so the two words are never split across lines. */}
                {archive && <>. <a href={archive} rel="noopener">Archived&nbsp;copy</a></>}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
