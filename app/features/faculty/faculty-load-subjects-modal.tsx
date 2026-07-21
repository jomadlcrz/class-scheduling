import type { FacultyLoadRow } from "~/features/faculty/faculty-load-table";

type FacultyLoadSubjectsModalProps = {
  row: FacultyLoadRow;
};

/** Read-only breakdown of one faculty member's subjects — opened from the "view subjects" action. */
export function FacultyLoadSubjectsModal({ row }: FacultyLoadSubjectsModalProps) {
  if (row.subjects.length === 0) {
    return (
      <p className="font-body text-sm text-slate-500 dark:text-slate-400">No subjects assigned.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {row.subjects.map((s, i) => (
        <div
          key={`${s.subjectCode}-${i}`}
          className={i > 0 ? "border-t border-slate-200 pt-4 dark:border-white/10" : ""}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium text-navy-700 dark:text-mist-100">
              {s.subjectCode} — {s.descriptiveTitle}
            </span>
            <span className="shrink-0 font-body text-sm text-slate-500 dark:text-slate-400">
              {s.units != null ? `${s.units} units` : "—"}
            </span>
          </div>

          {s.programAbbrev && (
            <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
              Program: {s.programAbbrev}
            </p>
          )}

          {s.schedules && s.schedules.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {s.schedules.map((sc, si) => (
                <li key={si} className="font-body text-xs text-slate-500 dark:text-slate-400">
                  {sc.course} · {sc.day} {sc.time}
                  {sc.room ? ` · ${sc.room}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
