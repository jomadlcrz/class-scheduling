import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { Building2Icon, DoorOpenIcon, LayersIcon } from "~/components/ui/icons";
import type { Program } from "~/types/program";

export type BuildingSummaryData = {
  buildingName: string;
  floorCount: number;
  totalRooms: number;
  roomTypeCounts: Record<string, number>;
  labProgramIds: number[];
};

type BuildingSummaryPanelProps = {
  summary: BuildingSummaryData;
  programs: Program[];
};

const metricIconClassName =
  "grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300";

export function BuildingSummaryPanel({ summary, programs }: BuildingSummaryPanelProps) {
  const labPrograms = programs.filter((program) => summary.labProgramIds.includes(program.id));

  return (
    <Card className="p-5 xl:sticky xl:top-6">
      <div>
        <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Building summary
        </p>
        <h2 className="mt-1 break-words font-body text-base font-semibold text-navy-700 dark:text-mist-100">
          {summary.buildingName.trim() || "—"}
        </h2>
      </div>

      <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
        <div className="flex items-center gap-3 py-3">
          <span className={metricIconClassName}>
            <LayersIcon />
          </span>
          <div className="min-w-0 flex-1">
            <dt className="font-body text-xs text-slate-500 dark:text-slate-400">Total floors</dt>
            <dd className="mt-0.5 font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
              {summary.floorCount}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-3 py-3">
          <span className={metricIconClassName}>
            <Building2Icon />
          </span>
          <div className="min-w-0 flex-1">
            <dt className="font-body text-xs text-slate-500 dark:text-slate-400">Total rooms</dt>
            <dd className="mt-0.5 font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
              {summary.totalRooms}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-3 py-3">
          <span className={metricIconClassName}>
            <DoorOpenIcon />
          </span>
          <div className="min-w-0 flex-1">
            <dt className="font-body text-xs text-slate-500 dark:text-slate-400">Room types</dt>
            <dd className="mt-0.5 font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
              {Object.keys(summary.roomTypeCounts).length}
            </dd>
          </div>
        </div>
      </dl>

      {Object.keys(summary.roomTypeCounts).length > 0 && (
        <div className="mt-5">
          <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Room breakdown
          </h3>
          <ul className="mt-2 flex flex-col gap-1">
            {Object.entries(summary.roomTypeCounts).map(([type, count]) => (
              <li
                key={type}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 font-body text-sm text-navy-700 hover:bg-slate-50 dark:text-mist-100 dark:hover:bg-white/5"
              >
                <span className="min-w-0 truncate" title={type}>
                  {type}
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {labPrograms.length > 0 && (
        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
          <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Laboratory access
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {labPrograms.map((program) => (
              <Badge key={program.id} tone="violet">
                {program.abbrev}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
