import type { FacultyLoadRow } from "~/services/report.service";

export function FacultyLoad({ rows }: { rows: FacultyLoadRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center font-body text-sm text-slate-400">
        No faculty schedule data for this period.
      </p>
    );
  }

  const maxHours = Math.max(...rows.map((r) => r.totalHours), 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
      <table className="w-full min-w-140">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 dark:border-white/8 dark:bg-white/3">
            <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Faculty
            </th>
            <th className="px-4 py-3 text-right font-body text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subjects
            </th>
            <th className="px-4 py-3 text-right font-body text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Hours
            </th>
            <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Load
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-white/8 dark:bg-transparent">
          {rows.map((row) => (
            <tr
              key={row.facultyId}
              className="hover:bg-slate-50 dark:hover:bg-white/3"
            >
              <td className="px-4 py-3">
                <p className="font-body text-sm font-medium text-slate-800 dark:text-slate-100">
                  {row.facultyName}
                </p>
                <p className="font-body text-xs text-slate-400 dark:text-slate-500">
                  {row.subjects.join(", ")}
                </p>
              </td>
              <td className="px-4 py-3 text-right font-body text-sm text-slate-700 dark:text-slate-300">
                {row.subjectCount}
              </td>
              <td className="px-4 py-3 text-right font-body text-sm font-medium text-navy-700 dark:text-white">
                {row.totalHours.toFixed(1)} hrs
              </td>
              <td className="px-4 py-3">
                <div className="h-2 w-full max-w-30 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className="h-2 rounded-full bg-navy-700 dark:bg-gold-400"
                    style={{ width: `${(row.totalHours / maxHours) * 100}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
