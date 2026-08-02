import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
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

const summaryRowClassName =
  "flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5";

export function BuildingSummaryPanel({ summary, programs }: BuildingSummaryPanelProps) {
  const labPrograms = programs.filter((p) => summary.labProgramIds.includes(p.id));

  return (
    <Card className="sticky top-6 p-5">
      <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
        Building Summary
      </h2>

      <dl className="mt-4 flex flex-col gap-3">
        <div className={summaryRowClassName}>
          <dt className="text-slate-500 dark:text-slate-400">Building Name</dt>
          <dd className="font-medium text-navy-700 dark:text-mist-100">
            {summary.buildingName.trim() || "—"}
          </dd>
        </div>
        <div className={summaryRowClassName}>
          <dt className="text-slate-500 dark:text-slate-400">Total Floors</dt>
          <dd className="font-medium text-navy-700 dark:text-mist-100">{summary.floorCount}</dd>
        </div>
        <div className={summaryRowClassName}>
          <dt className="text-slate-500 dark:text-slate-400">Total Rooms</dt>
          <dd className="font-medium text-navy-700 dark:text-mist-100">{summary.totalRooms}</dd>
        </div>
      </dl>

      {Object.keys(summary.roomTypeCounts).length > 0 && (
        <div className="mt-5">
          <h3 className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
            Room Breakdown
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {Object.entries(summary.roomTypeCounts).map(([type, count]) => (
              <li key={type} className={summaryRowClassName}>
                <span>{type}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {labPrograms.length > 0 && (
        <div className="mt-5">
          <h3 className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
            Programs using laboratories
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {labPrograms.map((p) => (
              <Badge key={p.id} tone="violet">
                {p.abbrev}
              </Badge>
            ))}
          </div>
        </div>
      )}

    </Card>
  );
}
