import { Card } from "~/components/ui/card";
import { scheduleReleaseStatusLabel } from "~/features/academic-terms/status-badges";
import type { StatusCounts } from "~/features/schedules/hub/scheduling-stages";
import type { ScheduleReleaseStatus } from "~/types/schedule-release";

const STATUS_ORDER: ScheduleReleaseStatus[] = ["draft", "pending_approval", "approved", "rejected"];

function Tile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-2xl leading-none tracking-wide tabular-nums text-navy-700 dark:text-mist-100">
        {value}
      </span>
      <span className="font-body text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

/** Glanceable term rollup: built vs total, then per-status counts (labels from the backend). */
export function HubStatStrip({
  built,
  total,
  counts,
}: {
  built: number;
  total: number;
  counts: StatusCounts;
}) {
  return (
    <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-5">
      <Tile value={`${built}/${total}`} label="Sections built" />
      {STATUS_ORDER.map((status) => (
        <Tile key={status} value={counts[status]} label={scheduleReleaseStatusLabel(status)} />
      ))}
    </Card>
  );
}
