import { Badge, type BadgeTone } from "~/components/ui/badge";
import type { LoadClassification } from "~/types/faculty-load";

const TONE: Record<LoadClassification, BadgeTone> = {
  underload: "gold",
  regular: "green",
  overload: "red",
};

const LABEL: Record<LoadClassification, string> = {
  underload: "Underload",
  regular: "Regular",
  overload: "Overload",
};

/** Underload / regular / overload badge — assigned contact hours vs the term policy. */
export function LoadClassificationBadge({
  classification,
}: {
  classification: LoadClassification;
}) {
  return <Badge tone={TONE[classification]}>{LABEL[classification]}</Badge>;
}
