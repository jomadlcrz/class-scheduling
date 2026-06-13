import { Badge, type BadgeTone } from "../../components/ui/badge";
import { SUBJECT_TYPE_LABELS, type SubjectType } from "../../types/subject";

const typeTones: Record<SubjectType, BadgeTone> = {
  gened: "emerald",
  "major-lab": "navy",
  major: "sky",
  minor: "slate",
  research: "gold",
};

export function SubjectTypeBadge({ type }: { type: SubjectType }) {
  return <Badge tone={typeTones[type]}>{SUBJECT_TYPE_LABELS[type]}</Badge>;
}
