import { Badge, type BadgeTone } from "~/components/ui/badge";
import { SUBJECT_TYPE_LABELS, type SubjectType } from "~/types/subject";

const typeTones: Record<SubjectType, BadgeTone> = {
  gened: "violet",
  "major-lab": "navy",
  major: "emerald",
  minor: "slate",
};

export function SubjectTypeBadge({ type }: { type: SubjectType }) {
  return <Badge tone={typeTones[type]}>{SUBJECT_TYPE_LABELS[type]}</Badge>;
}
