import { Badge, type BadgeTone } from "~/components/ui/badge";
import { SUBJECT_TYPE_LABELS, SUBJECT_TYPE_TONES } from "~/types/subject";

/** Renders a backend SubjectTypeName value with a display label. */
export function SubjectTypeBadge({ type }: { type: string }) {
  return (
    <Badge tone={SUBJECT_TYPE_TONES[type] ?? "slate"}>
      {SUBJECT_TYPE_LABELS[type] ?? type}
    </Badge>
  );
}

const TYPE_TEXT_CLASS: Record<BadgeTone, string> = {
  navy: "text-blue-700 dark:text-navy-300",
  gold: "text-amber-700 dark:text-gold-300",
  emerald: "text-green-700 dark:text-emerald-300",
  blue: "text-blue-700 dark:text-blue-300",
  green: "text-green-700 dark:text-green-300",
  red: "text-red-700 dark:text-red-300",
  sky: "text-sky-700 dark:text-sky-300",
  violet: "text-violet-700 dark:text-violet-300",
  slate: "text-slate-500 dark:text-slate-400",
};

/** Compact colored-text version of SubjectTypeBadge for dense table/list rows. */
export function SubjectTypeText({ type }: { type: string }) {
  const tone = SUBJECT_TYPE_TONES[type] ?? "slate";
  return (
    <span className={`font-body text-xs font-medium ${TYPE_TEXT_CLASS[tone]}`}>
      {SUBJECT_TYPE_LABELS[type] ?? type}
    </span>
  );
}
