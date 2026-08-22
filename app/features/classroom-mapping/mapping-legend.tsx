import { Card } from "~/components/ui/card";
import { useEnums } from "~/hooks/use-enums";
import { SUBJECT_TYPES, TYPE_LABELS, TYPE_STYLES, type SubjectType } from "./mapping-model";

const DEFAULT_STYLE = {
  card: "bg-slate-100 dark:bg-slate-800/50",
  border: "border-l-slate-500",
  code: "text-slate-700 dark:text-slate-300",
  tableCode: "text-slate-600 dark:text-slate-400",
  dot: "bg-slate-500",
};

export function MappingLegend() {
  const { enums } = useEnums();
  const subjectTypes = enums?.subjectType ?? (SUBJECT_TYPES as readonly string[]);

  return (
    <Card className="mx-auto flex w-full flex-nowrap items-center justify-start gap-4 overflow-x-auto px-5 py-2 sm:justify-center">
      {subjectTypes.map((type) => {
        const style = TYPE_STYLES[type as SubjectType] ?? DEFAULT_STYLE;
        const label = TYPE_LABELS[type as SubjectType] ?? type;
        return (
          <div key={type} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            <span className={`inline-block h-1 w-7 rounded-full ${style.dot}`} />
            <span className="font-body text-xs text-slate-500 dark:text-slate-400">{label}</span>
          </div>
        );
      })}
    </Card>
  );
}
