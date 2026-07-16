import type { FacultyLoadRecord } from "~/types/faculty-load";

type FacultyAvailabilityProps = {
  /** The faculty's existing teaching term for the selected school year + semester, if any. */
  existingLoad: FacultyLoadRecord | undefined;
};

/**
 * Shows what a faculty member is already carrying for the selected term before
 * the dean adds more subjects — current_weekly_hours only reflects generated
 * class schedules (set elsewhere), not this assignment step, so it's shown as
 * reference rather than a live projection.
 */
export function FacultyAvailability({ existingLoad }: FacultyAvailabilityProps) {
  if (!existingLoad) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-body text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        No existing load for this faculty in the selected term yet.
      </div>
    );
  }

  const { maxWeeklyHours, currentWeeklyHours, loadedSubjects, totalLoadUnits } = existingLoad;
  const percent = maxWeeklyHours > 0 ? Math.min(Math.round((currentWeeklyHours / maxWeeklyHours) * 100), 100) : 0;
  const isOver = maxWeeklyHours > 0 && currentWeeklyHours > maxWeeklyHours;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-2 font-body text-xs">
        <span className="font-semibold text-slate-500 dark:text-slate-400">
          Already teaching this term
        </span>
        <span
          className={
            isOver
              ? "font-semibold text-red-600 dark:text-red-400"
              : "text-slate-500 dark:text-slate-400"
          }
        >
          {currentWeeklyHours} / {maxWeeklyHours} hrs
        </span>
      </div>
      {maxWeeklyHours > 0 && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isOver ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      <p className="mt-1.5 font-body text-xs text-slate-500 dark:text-slate-400">
        {loadedSubjects.length} subject{loadedSubjects.length === 1 ? "" : "s"} assigned ·{" "}
        {totalLoadUnits} units
      </p>
    </div>
  );
}
