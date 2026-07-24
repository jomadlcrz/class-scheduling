import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import type { FacultyLoadingEntry } from "~/types/faculty-load";

type DeanSubjectAssignmentListProps = {
  entries: FacultyLoadingEntry[];
};

export function DeanSubjectAssignmentList({ entries }: DeanSubjectAssignmentListProps) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) => (
        <Card key={entry.instructorName} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                {entry.instructorName}
              </p>
              <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                {entry.department}
                {entry.maxWeeklyHours != null && ` · Max ${entry.maxWeeklyHours} hrs/week`}
              </p>
            </div>
            <Badge tone="navy">
              {entry.subjects.length} subject{entry.subjects.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {entry.subjects.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse font-body text-xs">
                <thead>
                  <tr>
                    <th className="border border-slate-200 px-2 py-1 text-left font-semibold text-navy-700 dark:border-white/10 dark:text-mist-200">
                      Code
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-left font-semibold text-navy-700 dark:border-white/10 dark:text-mist-200">
                      Title
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-center font-semibold text-navy-700 dark:border-white/10 dark:text-mist-200">
                      LEC
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-center font-semibold text-navy-700 dark:border-white/10 dark:text-mist-200">
                      LAB
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-center font-semibold text-navy-700 dark:border-white/10 dark:text-mist-200">
                      Schedules
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entry.subjects.map((s) => {
                    const schedCount = s.schedules.length;
                    return (
                      <tr key={s.subjectCode}>
                        <td className="border border-slate-200 px-2 py-1.5 font-medium text-navy-700 dark:border-white/10 dark:text-mist-100">
                          {s.subjectCode}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-slate-600 dark:border-white/10 dark:text-slate-300">
                          {s.descriptiveTitle}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center dark:border-white/10">
                          {s.units.lecHours}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center dark:border-white/10">
                          {s.units.labHours}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center dark:border-white/10">
                          {schedCount > 0 ? (
                            <span className="text-slate-500 dark:text-slate-400">
                              {schedCount} session{schedCount !== 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 font-body text-xs text-slate-400 dark:text-slate-500">
              No subjects assigned yet.
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
