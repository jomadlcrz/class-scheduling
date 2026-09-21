import { Badge, type BadgeTone } from "~/components/ui/badge";
import type { InstructorLoadClassification } from "~/types/faculty-load";

const TONE: Record<InstructorLoadClassification, BadgeTone> = {
  underload: "gold",
  regular: "green",
  overload: "red",
};

const LABEL: Record<InstructorLoadClassification, string> = {
  underload: "Underload",
  regular: "Regular",
  overload: "Overload",
};

/** Underload / regular / overload badge — assigned contact hours vs the term policy. */
export function LoadClassificationBadge({
  classification,
}: {
  classification: InstructorLoadClassification;
}) {
  return <Badge tone={TONE[classification]}>{LABEL[classification]}</Badge>;
}
