import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { FacultyLoadingLetterhead } from "~/features/faculty/faculty-loading-letterhead";
import { FacultyLoadingScheduleTable } from "~/features/faculty/faculty-loading-schedule-table";
import type { FacultyLoadingEntry } from "~/types/faculty-load";
import type { ScheduleSemester } from "~/types/schedule";
import type { Semester } from "~/types/semester";

type FacultyScheduleViewProps = {
  entry: FacultyLoadingEntry | null;
  isLoading: boolean;
  schoolYears: string[];
  schoolYear: string;
  schoolYearLabel: string;
  onSchoolYearChange: (schoolYear: string) => void;
  semesters: Semester[];
  semester: ScheduleSemester;
  semesterName: string;
  onSemesterChange: (semester: ScheduleSemester) => void;
  semesterLabel: (n: number) => string;
};

/** Document-style faculty loading view matching the official letterhead layout. */
export function FacultyScheduleView({
  entry,
  isLoading,
  schoolYears,
  schoolYear,
  schoolYearLabel,
  onSchoolYearChange,
  semesters,
  semester,
  semesterName,
  onSemesterChange,
  semesterLabel,
}: FacultyScheduleViewProps) {
  return (
    <div className="mx-auto flex max-w-240 flex-col gap-4">
      {/* ── Letterhead ── */}
      <FacultyLoadingLetterhead
        entry={entry}
        schoolYearLabel={schoolYearLabel}
        semesterName={semesterName}
      />

      {/* ── Info grid ── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-body text-xs">
          <tbody>
            <tr>
              <td className="w-[12%] border border-slate-300 px-3 py-1.5 font-bold text-navy-800 dark:border-white/15 dark:text-mist-100">
                NAME
              </td>
              <td className="w-[38%] border border-slate-300 px-3 py-1.5 text-navy-700 dark:border-white/15 dark:text-mist-200">
                {entry?.instructorName ?? "—"}
              </td>
              <td className="w-[12%] border border-slate-300 px-3 py-1.5 font-bold text-navy-800 dark:border-white/15 dark:text-mist-100">
                SEMESTER
              </td>
              <td className="w-[38%] border border-slate-300 px-1 py-0.5 dark:border-white/15">
                <Select
                  items={semesters
                    .filter((s) => s.semesterNumber !== 3)
                    .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))}
                  value={String(semester)}
                  onValueChange={(v) => onSemesterChange(Number(v) as ScheduleSemester)}
                >
                  <SelectTrigger className="border-0 px-2 py-1 font-body text-xs focus-visible:ring-0 dark:focus-visible:ring-0 *:data-[slot=select-trigger-icon]:text-slate-500 dark:*:data-[slot=select-trigger-icon]:text-slate-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters
                      .filter((s) => s.semesterNumber !== 3)
                      .map((s) => (
                        <SelectItem key={s.id} value={String(s.semesterNumber)}>
                          {semesterLabel(s.semesterNumber)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-3 py-1.5 font-bold text-navy-800 dark:border-white/15 dark:text-mist-100">
                DEPARTMENT
              </td>
              <td className="border border-slate-300 px-3 py-1.5 text-navy-700 dark:border-white/15 dark:text-mist-200">
                {entry?.department ?? "—"}
              </td>
              <td className="border border-slate-300 px-3 py-1.5 font-bold text-navy-800 dark:border-white/15 dark:text-mist-100">
                ACADEMIC YEAR
              </td>
              <td className="border border-slate-300 px-1 py-0.5 dark:border-white/15">
                <Select
                  items={schoolYears.map((y) => ({ value: y, label: y }))}
                  value={schoolYear}
                  onValueChange={(v) => onSchoolYearChange(v as string)}
                >
                  <SelectTrigger className="border-0 px-2 py-1 font-body text-xs focus-visible:ring-0 dark:focus-visible:ring-0 *:data-[slot=select-trigger-icon]:text-slate-500 dark:*:data-[slot=select-trigger-icon]:text-slate-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Schedule table ── */}
      <div className="overflow-x-auto">
        {entry ? (
          <FacultyLoadingScheduleTable entry={entry} isLoading={isLoading} />
        ) : isLoading ? (
          <div className="grid place-items-center py-8 text-navy-700 dark:text-slate-200">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-transparent dark:border-mist-100 dark:border-t-transparent" />
          </div>
        ) : (
          <div className="py-8 text-center font-body text-sm text-slate-500 dark:text-slate-400">
            No classes scheduled for the selected term.
          </div>
        )}
      </div>
    </div>
  );
}
