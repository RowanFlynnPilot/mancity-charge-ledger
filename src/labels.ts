// Words for values in the data, shared between views.
import type { Case } from "./types";

export const STATUS_LABEL: Record<Case["status"], string> = { open: "Open", closed: "Closed" };
