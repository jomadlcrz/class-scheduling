import { Badge } from "~/components/ui/badge";
import { SUBJECT_TYPE_TONES } from "~/types/subject";

/** Renders a backend SubjectTypeName value, e.g. "GenEd" or "Major with Lab". */
export function SubjectTypeBadge({ type }: { type: string }) {
  return <Badge tone={SUBJECT_TYPE_TONES[type] ?? "slate"}>{type}</Badge>;
}
