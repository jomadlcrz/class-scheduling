import { Card } from "~/components/ui/card";
import { useEnums } from "~/hooks/use-enums";
import {
  MAJOR_WITH_LAB_LECTURE_STYLE,
  SUBJECT_TYPES,
  TYPE_LABELS,
  TYPE_STYLES,
  type SubjectType,
} from "./mapping-model";

const DEFAULT_STYLE = {
  card: "bg-slate-100 dark:bg-slate-800/50",
  border: "border-l-slate-500",
  code: "text-slate-700 dark:text-slate-300",
  tableCode: "text-slate-600 dark:text-slate-400",
  dot: "bg-slate-500",
};

export function MappingLegend({
  types,
  splitMajorWithLab = false,
  compact = false,
}: {
  types?: readonly SubjectType[];
  splitMajorWithLab?: boolean;
  compact?: boolean;
} = {}) {
  const { enums } = useEnums();
  const rawTypes = types ?? (enums?.subjectType as readonly SubjectType[] | undefined) ?? SUBJECT_TYPES;

  const items = rawTypes.flatMap((type) => {
    if (type === "Major with Lab" && splitMajorWithLab) {
      return [
        {
          key: "Major with Lab-LAB",
          label: compact ? "Major + Lab · LAB" : "Major with Lab (Lab session)",
          dot: TYPE_STYLES[type]?.dot ?? DEFAULT_STYLE.dot,
        },
        {
          key: "Major with Lab-LEC",
          label: compact ? "Major + Lab · LEC" : "Major with Lab (Lecture session)",
          dot: MAJOR_WITH_LAB_LECTURE_STYLE.dot,
        },
      ];
    }
    return [
      {
        key: type,
        label: TYPE_LABELS[type as SubjectType] ?? type,
        dot: TYPE_STYLES[type as SubjectType]?.dot ?? DEFAULT_STYLE.dot,
      },
    ];
  });

  return (
    <Card
      className={
        compact
          ? "flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 py-1.5"
          : "mx-auto flex w-full flex-nowrap items-center justify-start gap-4 overflow-x-auto px-5 py-2 sm:justify-center"
      }
    >
      {items.map((item) => (
        <div
          key={item.key}
          className={`flex shrink-0 items-center whitespace-nowrap ${compact ? "gap-1" : "gap-1.5"}`}
        >
          <span
            className={`inline-block ${compact ? "size-2 rounded-sm" : "h-1 w-7 rounded-full"} ${item.dot}`}
          />
          <span
            className={`font-body text-slate-500 dark:text-slate-400 ${compact ? "text-[0.6875rem]" : "text-xs"}`}
          >
            {item.label}
          </span>
        </div>
      ))}
    </Card>
  );
}
