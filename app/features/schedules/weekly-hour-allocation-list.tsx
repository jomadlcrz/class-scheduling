import { Badge } from "~/components/ui/badge";
import type { WeeklyHourAllocation } from "~/types/weekly-hour-allocation";

type Props = {
  allocations: WeeklyHourAllocation[];
};

function fmt(val: number): string {
  return Number.isInteger(val) ? `${val}.0` : String(val);
}

export function WeeklyHourAllocationList({ allocations }: Props) {
  if (allocations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-slate-400 dark:text-slate-500">
        <p className="font-body text-sm">No allocations set yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {allocations.map((a, i) => (
        <div
          key={a.subjectType}
          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5"
        >
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-slate-100 font-body text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-body text-sm font-semibold text-navy-700 dark:text-white">
              {a.subjectTypeLabel}
            </p>
            <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
              <span>{fmt(a.lectureHours)} lec</span>
              <span className="mx-1">·</span>
              <span>{fmt(a.labHours)} lab</span>
              <span className="mx-1">·</span>
              <span>{a.meetings} {a.meetings === 1 ? "meeting" : "meetings"} per week</span>
            </p>
            {a.labTimeSlots.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {a.labTimeSlots.map((slot, j) => (
                  <Badge key={j} tone="navy">{slot.start} – {slot.end}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
