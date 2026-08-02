import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { PlusIcon, TrashIcon } from "~/components/ui/icons";
import type { EditBuildingChangeSummary } from "~/types/facility";
import type { Program } from "~/types/program";

export type EditBuildingSummaryData = {
  buildingName: string;
  floorCount: number;
  totalRooms: number;
  existingRoomCount: number;
  roomTypeCounts: Record<string, number>;
  labProgramIds: number[];
  changes: EditBuildingChangeSummary;
};

type EditBuildingSummaryPanelProps = {
  summary: EditBuildingSummaryData;
  programs: Program[];
};

const summaryRowClassName =
  "flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5";

const changeRowClassName =
  "flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10";

export function EditBuildingSummaryPanel({ summary, programs }: EditBuildingSummaryPanelProps) {
  const labPrograms = programs.filter((p) => summary.labProgramIds.includes(p.id));
  const hasChanges =
    summary.changes.added > 0 || summary.changes.modified > 0 || summary.changes.deleted > 0;

  return (
    <Card className="sticky top-6 p-5">
      <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
        Building Summary
      </h2>

      <dl className="mt-4 flex flex-col gap-3">
        <div className={summaryRowClassName}>
          <dt className="text-slate-500 dark:text-slate-400">Total Floors</dt>
          <dd className="font-medium text-navy-700 dark:text-mist-100">{summary.floorCount}</dd>
        </div>
        <div className={summaryRowClassName}>
          <dt className="text-slate-500 dark:text-slate-400">Total Rooms</dt>
          <dd className="font-medium text-navy-700 dark:text-mist-100">
            {summary.totalRooms}
            {summary.changes.added > 0 && (
              <span className="ml-1 text-xs font-normal text-slate-500">
                ({summary.existingRoomCount} existing + {summary.changes.added} new)
              </span>
            )}
          </dd>
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

      {hasChanges && (
        <div className="mt-5">
          <h3 className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
            Pending Changes
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {summary.changes.added > 0 && (
              <li className={`${changeRowClassName} border-blue-200 bg-blue-50/70 dark:border-blue-400/20 dark:bg-blue-400/5`}>
                <span className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                  <PlusIcon />
                  Newly Added Rooms
                </span>
                <span className="font-medium text-blue-800 dark:text-blue-300">{summary.changes.added}</span>
              </li>
            )}
            {summary.changes.modified > 0 && (
              <li className={`${changeRowClassName} border-amber-200 bg-amber-50/70 dark:border-gold-400/20 dark:bg-gold-400/5`}>
                <span className="text-amber-800 dark:text-gold-300">Modified Rooms</span>
                <span className="font-medium text-amber-800 dark:text-gold-300">{summary.changes.modified}</span>
              </li>
            )}
            {summary.changes.deleted > 0 && (
              <li className={`${changeRowClassName} border-red-200 bg-red-50/70 dark:border-red-400/20 dark:bg-red-400/5`}>
                <span className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <TrashIcon />
                  Deleted Rooms
                </span>
                <span className="font-medium text-red-700 dark:text-red-300">{summary.changes.deleted}</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </Card>
  );
}
