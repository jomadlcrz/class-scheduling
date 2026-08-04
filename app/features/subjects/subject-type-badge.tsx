import { Badge } from "~/components/ui/badge";
import { SUBJECT_TYPE_LABELS, SUBJECT_TYPE_TONES } from "~/types/subject";

/** Renders a backend SubjectTypeName value with a display label. */
export function SubjectTypeBadge({ type }: { type: string }) {
  return (
    <Badge tone={SUBJECT_TYPE_TONES[type] ?? "slate"}>
      {SUBJECT_TYPE_LABELS[type] ?? type}
    </Badge>
  );
}
