// The one place colour carries meaning. Every badge also says what it means in words.
import type { AppealState, Finding } from "../types";

export const FINDING_LABEL: Record<Finding, string> = {
  proven: "Proven",
  "proven-in-part": "Proven in part",
  "not-proven": "Not proven",
};

export const APPEAL_LABEL: Record<AppealState, string> = {
  none: "No appeal lodged",
  pending: "Appeal pending",
  upheld: "Upheld on appeal",
  overturned: "Overturned on appeal",
};

// A finding overturned on appeal no longer stands, so it is shown struck through.
export function FindingBadge({ finding, appeal }: { finding: Finding; appeal: AppealState }) {
  const overturned = appeal === "overturned";
  return (
    <span className={`badge finding finding-${finding}${overturned ? " is-overturned" : ""}`}>
      <span className="finding-glyph" aria-hidden="true" />
      {FINDING_LABEL[finding]}
    </span>
  );
}

export function AppealBadge({ appeal }: { appeal: AppealState }) {
  return <span className={`badge appeal appeal-${appeal}`}>{APPEAL_LABEL[appeal]}</span>;
}
