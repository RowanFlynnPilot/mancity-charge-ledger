import type { Source, SourceKind } from "../types";

const KIND_LABEL: Record<SourceKind, string> = {
  primary: "Primary document",
  press: "Press report",
};

const isPdf = (url: string) => new URL(url).pathname.toLowerCase().endsWith(".pdf");

export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ul className="sources" aria-label="Sources">
      {sources.map((source) => (
        <li key={source.url}>
          <span className={`source-kind source-kind-${source.kind}`}>{KIND_LABEL[source.kind]}</span>
          <span>
            <a href={source.url} rel="noopener">{source.title}</a>
            <span className="source-publisher">
              {isPdf(source.url) && " (PDF)"}, {source.publisher}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
