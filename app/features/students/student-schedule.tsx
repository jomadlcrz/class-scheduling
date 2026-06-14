import { DAY_LABELS, type Schedule } from "../../types/schedule";
import type { Student } from "../../types/student";

type StudentScheduleProps = {
  student: Student;
  schedules: Schedule[];
};

export function StudentSchedule({ student, schedules }: StudentScheduleProps) {
  const studentSchedules = schedules.filter(
    (s) =>
      s.program === student.program &&
      s.yearLevel === student.yearLevel &&
      s.setCode === student.setCode,
  );

  if (studentSchedules.length === 0) {
    return (
      <p className="py-6 text-center font-sans text-sm text-slate-400 dark:text-slate-500">
        No schedule entries for this student's section.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-sans text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/8">
            <th className="py-2.5 pr-4 text-left font-medium text-slate-400 dark:text-slate-500">Subject</th>
            <th className="py-2.5 pr-4 text-left font-medium text-slate-400 dark:text-slate-500">Faculty</th>
            <th className="py-2.5 pr-4 text-left font-medium text-slate-400 dark:text-slate-500">Room</th>
            <th className="py-2.5 pr-4 text-left font-medium text-slate-400 dark:text-slate-500">Day</th>
            <th className="py-2.5 text-left font-medium text-slate-400 dark:text-slate-500">Time</th>
          </tr>
        </thead>
        <tbody>
          {studentSchedules.map((s) => (
            <tr key={s.id} className="border-b border-slate-50 last:border-0 dark:border-white/5">
              <td className="py-2.5 pr-4">
                <p className="font-medium text-navy-700 dark:text-slate-200">{s.subjectCode}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{s.subjectTitle}</p>
              </td>
              <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{s.facultyName}</td>
              <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">
                {s.buildingCode} — {s.roomName}
              </td>
              <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">
                {DAY_LABELS[s.day] ?? s.day}
              </td>
              <td className="py-2.5 text-slate-500 dark:text-slate-400">
                {s.startTime} – {s.endTime}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
