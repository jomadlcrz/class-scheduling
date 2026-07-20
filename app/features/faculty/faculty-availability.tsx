import type { FacultyLoadingEntry } from "~/types/faculty-load";

type FacultyAvailabilityProps = {
  /** The faculty's existing loading-sheet entry for the selected school year + semester, if any. */
  existingLoad: FacultyLoadingEntry | undefined;
};

/**
 * Shows what a faculty member is already carrying for the selected term before
 * the dean adds more subjects. GET /deans/faculty-loading only reports
 * assigned subjects and their scheduled sessions — it doesn't return
 * max/current weekly hours, so this is a subject/unit summary, not a capacity meter.
 */
export function FacultyAvailability({ existingLoad }: FacultyAvailabilityProps) {
  if (!existingLoad) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-body text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        No existing load for this faculty in the selected term yet.
      </div>
    );
  }

  const subjectCount = existingLoad.subjects.length;
  const totalUnits = existingLoad.subjects.reduce((sum, s) => sum + s.units.total, 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <span className="font-body text-xs font-semibold text-slate-500 dark:text-slate-400">
        Already teaching this term
      </span>
      <p className="mt-1.5 font-body text-xs text-slate-500 dark:text-slate-400">
        {subjectCount} subject{subjectCount === 1 ? "" : "s"} assigned · {totalUnits} units
      </p>
    </div>
  );
}
