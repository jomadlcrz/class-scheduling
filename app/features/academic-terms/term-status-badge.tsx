import { LockIcon } from "~/components/ui/icons";
import { closedReasonTone, StatusBadge, termStatusTone } from "~/features/academic-terms/status-badges";
import type { TermClosureItem } from "~/types/term-closure";

type TermStatusBadgeProps = {
  term: TermClosureItem | null | undefined;
  compact?: boolean;
};

/** Compact open/closed badge for the global term selector. */
export function TermStatusBadge({ term, compact = false }: TermStatusBadgeProps) {
  if (!term) return null;

  if (term.status === "Open") {
    return (
      <StatusBadge tone={termStatusTone("Open")}>
        {compact ? "Open" : "Open — accepts changes"}
      </StatusBadge>
    );
  }

  const label =
    term.closedReason === "school_year_ended"
      ? compact
        ? "Year ended"
        : "Closed — year ended"
      : compact
        ? "Posted"
        : "Closed — posted";

  return (
    <StatusBadge tone={closedReasonTone(term.closedReason)} icon={<LockIcon size={12} />}>
      {term.closedReasonLabel ?? label}
    </StatusBadge>
  );
}
