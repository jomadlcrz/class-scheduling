import { Card } from "~/components/ui/card";
import { SUBJECT_TYPES, TYPE_LABELS, TYPE_STYLES } from "./mapping-model";

export function MappingLegend() {
  return (
    <Card className="mx-auto flex w-full flex-nowrap items-center justify-start gap-4 overflow-x-auto px-5 py-2 sm:justify-center">
      {SUBJECT_TYPES.map((type) => (
        <div key={type} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <span className={`inline-block h-1 w-7 rounded-full ${TYPE_STYLES[type].dot}`} />
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">{TYPE_LABELS[type]}</span>
        </div>
      ))}
    </Card>
  );
}
