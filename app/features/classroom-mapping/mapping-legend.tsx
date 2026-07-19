import { Card } from "~/components/ui/card";
import { TYPE_LABELS, TYPE_STYLES, type SubjectType } from "./mapping-model";

const LEGEND_ITEMS: { label: string; type: SubjectType }[] = [
  { label: "Major (Lab)",    type: "major_lab"    },
  { label: "Major (w/o Lab)", type: "major_no_lab" },
  { label: "GenEd",         type: "gen_ed"       },
];

export function MappingLegend() {
  return (
    <Card className="mx-auto flex w-fit max-w-full flex-nowrap items-center justify-center gap-4 overflow-x-auto px-5 py-2">
      {LEGEND_ITEMS.map(({ label, type }) => (
        <div key={type} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <span className={`inline-block h-1 w-7 rounded-full ${TYPE_STYLES[type].dot}`} />
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">{label}</span>
        </div>
      ))}
    </Card>
  );
}
