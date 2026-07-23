import type { FacultyLoadingEntry } from "~/types/faculty-load";
import type { ScheduleSemester } from "~/types/schedule";
import type { Semester } from "~/types/semester";

type FacultyScheduleViewProps = {
  entry: FacultyLoadingEntry | null;
  isLoading: boolean;
  schoolYears: string[];
  schoolYear: string;
  onSchoolYearChange: (schoolYear: string) => void;
  semesters: Semester[];
  semester: ScheduleSemester;
  onSemesterChange: (semester: ScheduleSemester) => void;
  semesterLabel: (n: number) => string;
};

function flattenRows(entry: FacultyLoadingEntry) {
  const rows: {
    subjectCode: string;
    descriptiveTitle: string;
    lecHours: number;
    labHours: number;
    day: string;
    time: string;
    numberOfStudents: number;
    course: string;
    yearLevel: string;
    setCode: string;
    room: string;
    isFirstOfSubject: boolean;
  }[] = [];

  for (const subject of entry.subjects) {
    subject.schedules.forEach((sched, idx) => {
      rows.push({
        subjectCode: subject.subjectCode,
        descriptiveTitle: subject.descriptiveTitle,
        lecHours: subject.units.lecHours,
        labHours: subject.units.labHours,
        day: sched.day,
        time: sched.time,
        numberOfStudents: sched.numberOfStudents,
        course: sched.course,
        yearLevel: String(sched.yearLevel),
        setCode: sched.setCode,
        room: sched.room ?? "",
        isFirstOfSubject: idx === 0,
      });
    });
  }

  return rows;
}

const selectClassName =
  "w-full appearance-none border-0 bg-transparent bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%230f1e3c%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_4px_center] bg-no-repeat px-3 py-1.5 pr-6 font-body text-xs text-navy-700 focus:outline-none dark:text-mist-200 dark:stroke-mist-200";

/** Document-style faculty loading view matching the official letterhead layout. */
export function FacultyScheduleView({
  entry,
  isLoading,
  schoolYears,
  schoolYear,
  onSchoolYearChange,
  semesters,
  semester,
  onSemesterChange,
  semesterLabel,
}: FacultyScheduleViewProps) {
  const rows = entry ? flattenRows(entry) : [];

  return (
    <div className="mx-auto max-w-[960px overflow-hidden border border-slate-300 bg-white dark:border-white/15 dark:bg-navy-950">
      {/* ── Letterhead ── */}
      <div className="flex items-center justify-center gap-4 border-b-2 border-navy-800 px-4 py-3 dark:border-navy-400">
        <img
          src="/images/logos/gwc-logo.avif"
          alt="GWC logo"
          className="h-16 w-16 shrink-0 rounded-full object-contain"
        />
        <div className="text-center">
          <p className="font-display text-xl tracking-wide text-navy-800 dark:text-mist-100">
            GOLDEN WEST COLLEGES, INC.
          </p>
          <p className="font-body text-xs font-semibold text-navy-700 dark:text-mist-200">
            San Jose Drive, Alaminos City, Pangasinan *Tel. No. (075) 552-7382
          </p>
          <p className="font-body text-xs font-semibold text-navy-700 dark:text-mist-200">
            Email Address: goldenwest.colleges@yahoo.com.ph
          </p>
        </div>
      </div>

      {/* ── Title ── */}
      <div className="border-b border-slate-300 py-2 text-center font-display text-lg tracking-widest text-navy-800 dark:border-white/10 dark:text-mist-100">
        FACULTY LOADING
      </div>

      {/* ── Info grid ── */}
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
            <td className="w-[38%] border border-slate-300 p-0 dark:border-white/15">
              <select
                className={selectClassName}
                value={String(semester)}
                onChange={(e) => onSemesterChange(Number(e.target.value) as ScheduleSemester)}
              >
                {semesters
                  .filter((s) => s.semesterNumber !== 3)
                  .map((s) => (
                    <option key={s.id} value={String(s.semesterNumber)}>
                      {semesterLabel(s.semesterNumber)}
                    </option>
                  ))}
              </select>
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
            <td className="border border-slate-300 p-0 dark:border-white/15">
              <select
                className={selectClassName}
                value={schoolYear}
                onChange={(e) => onSchoolYearChange(e.target.value)}
              >
                {schoolYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Schedule table ── */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="grid place-items-center py-8 text-navy-700 dark:text-slate-200">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-transparent dark:border-mist-100 dark:border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center font-body text-sm text-slate-500 dark:text-slate-400">
            No classes scheduled for the selected term.
          </div>
        ) : (
          <table className="w-full border-collapse font-body text-xs">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="border border-slate-300 px-2 py-1.5 text-center font-bold text-navy-800 dark:border-white/15 dark:bg-navy-900 dark:text-mist-100"
                >
                  SUBJECT CODE
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-300 px-2 py-1.5 text-center font-bold text-navy-800 dark:border-white/15 dark:bg-navy-900 dark:text-mist-100"
                >
                  DESCRIPTIVE TITLE
                </th>
                <th
                  colSpan={2}
                  className="border border-slate-300 px-2 py-1.5 text-center font-bold text-navy-800 dark:border-white/15 dark:bg-navy-900 dark:text-mist-100"
                >
                  UNITS
                </th>
                <th
                  colSpan={2}
                  className="border border-slate-300 px-2 py-1.5 text-center font-bold text-navy-800 dark:border-white/15 dark:bg-navy-900 dark:text-mist-100"
                >
                  SCHEDULE
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-300 px-2 py-1.5 text-center font-bold text-navy-800 dark:border-white/15 dark:bg-navy-900 dark:text-mist-100"
                >
                  No. of
                  <br />
                  students
                </th>
                <th
                  colSpan={4}
                  className="border border-slate-300 px-2 py-1.5 text-center font-bold text-navy-800 dark:border-white/15 dark:bg-navy-900 dark:text-mist-100"
                >
                  Class Information
                </th>
              </tr>
              <tr>
                {["LEC", "LAB", "DAY", "TIME", "COURSE", "YEAR", "SET", "ROOM"].map(
                  (h) => (
                    <th
                      key={h}
                      className="border border-slate-300 px-2 py-1 text-center font-bold text-navy-800 dark:border-white/15 dark:bg-navy-900 dark:text-mist-100"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={row.isFirstOfSubject ? "border-t-2 border-t-navy-800 dark:border-t-navy-400" : ""}
                >
                  <td className="border border-slate-300 px-2 py-1.5 text-center dark:border-white/15">
                    {row.subjectCode}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center dark:border-white/15">
                    {row.descriptiveTitle}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center dark:border-white/15">
                    {row.lecHours}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center dark:border-white/15">
                    {row.labHours}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center dark:border-white/15">
                    {row.day}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center dark:border-white/15">
                    {row.time}
                  </td>
                  <td
                    className={`border border-slate-300 px-2 py-1.5 text-center dark:border-white/15 ${
                      row.numberOfStudents === 0
                        ? "font-bold text-red-700 dark:text-red-400"
                        : ""
                    }`}
                  >
                    {row.numberOfStudents}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center dark:border-white/15">
                    {row.course}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center dark:border-white/15">
                    {row.yearLevel}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold text-navy-700 dark:border-white/15 dark:text-mist-200">
                    {row.setCode}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center dark:border-white/15">
                    {row.room}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
