import { Card } from "~/components/ui/card";
import { YEAR_LEVEL_STYLES } from "./year-level-styles";

export function LabAnalysisLegend() {
  return (
    <Card className="mx-auto flex w-fit max-w-full flex-nowrap items-center justify-center gap-4 overflow-x-auto px-5 py-2">
      {Object.entries(YEAR_LEVEL_STYLES).map(([year, style]) => (
        <div key={year} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <span className={`inline-block h-3 w-3 rounded-full ${style.dot}`} />
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">Year {year}</span>
        </div>
      ))}
      <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
        <span className="inline-block h-3 w-3 rounded-full border border-dashed border-slate-400 dark:border-white/20" />
        <span className="font-body text-xs text-slate-500 dark:text-slate-400">Free</span>
      </div>
    </Card>
  );
}
