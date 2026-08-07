import type { FacultyLoadingEntry } from "~/types/faculty-load";

type ScheduleRow = {
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
  rowspan: number;
};

function buildRows(entry: FacultyLoadingEntry): ScheduleRow[] {
  const rows: ScheduleRow[] = [];

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
        rowspan: idx === 0 ? subject.schedules.length : 0,
      });
    });
  }

  return rows;
}

const thClass =
  "border border-slate-300 px-2 py-1.5 text-center font-bold text-navy-800 dark:border-white/15 dark:bg-navy-900 dark:text-mist-100";
const groupThClass =
  "border border-slate-300 px-2 py-1.5 text-center text-[11px] font-semibold tracking-wide text-navy-600 dark:border-white/15 dark:bg-navy-900/60 dark:text-mist-200";
const tdClass =
  "border border-slate-300 px-2 py-1.5 text-center text-navy-700 dark:border-white/15 dark:text-mist-200";

type FacultyLoadingScheduleTableProps = {
  entry: FacultyLoadingEntry;
  isLoading?: boolean;
};

export function FacultyLoadingScheduleTable({ entry, isLoading }: FacultyLoadingScheduleTableProps) {
  const rows = buildRows(entry);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-8 text-navy-700 dark:text-slate-200">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-transparent dark:border-mist-100 dark:border-t-transparent" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center font-body text-sm text-slate-500 dark:text-slate-400">
        No classes scheduled for the selected term.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto"><table className="w-full border-collapse font-body text-xs">
      <thead>
        <tr>
          <th rowSpan={2} className={thClass}>
            SUBJECT CODE
          </th>
          <th rowSpan={2} className={thClass}>
            DESCRIPTIVE TITLE
          </th>
          <th colSpan={2} className={thClass}>
            UNITS
          </th>
          <th colSpan={2} className={thClass}>
            SCHEDULE
          </th>
          <th rowSpan={2} className={thClass}>
            No. of
            <br />
            students
          </th>
          <th colSpan={4} className={thClass}>
            Class Information
          </th>
        </tr>
        <tr>
          {["LEC", "LAB", "DAY", "TIME", "COURSE", "YEAR", "SET", "ROOM"].map(
            (h) => (
              <th key={h} className={groupThClass}>
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
            {row.isFirstOfSubject && (
              <td rowSpan={row.rowspan} className={`${tdClass} font-medium`}>
                {row.subjectCode}
              </td>
            )}
            {row.isFirstOfSubject && (
              <td rowSpan={row.rowspan} className={tdClass}>
                {row.descriptiveTitle}
              </td>
            )}
            {row.isFirstOfSubject && (
              <td rowSpan={row.rowspan} className={tdClass}>
                {row.lecHours}
              </td>
            )}
            {row.isFirstOfSubject && (
              <td rowSpan={row.rowspan} className={tdClass}>
                {row.labHours}
              </td>
            )}
            <td className={tdClass}>{row.day}</td>
            <td className={tdClass}>{row.time}</td>
            <td
              className={`${tdClass} ${
                row.numberOfStudents === 0 ? "font-bold text-red-700 dark:text-red-400" : ""
              }`}
            >
              {row.numberOfStudents}
            </td>
            <td className={tdClass}>{row.course}</td>
            <td className={tdClass}>{row.yearLevel}</td>
            <td className={`${tdClass} font-semibold`}>{row.setCode}</td>
            <td className={tdClass}>{row.room}</td>
          </tr>
        ))}
      </tbody>
    </table></div>
  );
}
