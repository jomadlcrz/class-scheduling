import { useState } from "react";
import { Modal } from "~/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import type { StudentAssignedSchedule } from "~/services/irregular-class.service";

type AssignedScheduleTableProps = {
  students: StudentAssignedSchedule[];
};

export function AssignedScheduleTable({ students }: AssignedScheduleTableProps) {
  const [selected, setSelected] = useState<StudentAssignedSchedule | null>(null);

  return (
    <>
      <Table>
        <TableHead>
          <TableHeader>Student</TableHeader>
          <TableHeader className="hidden sm:table-cell">Student ID</TableHeader>
          <TableHeader>Subjects Enrolled</TableHeader>
        </TableHead>
        <TableBody>
          {students.map((student) => (
            <TableRow
              key={student.studentAcademicId}
              className="cursor-pointer"
              onClick={() => setSelected(student)}
            >
              <TableCell>
                <span className="font-medium text-navy-700 dark:text-mist-100">{student.studentName}</span>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
                {student.studentId ?? "—"}
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-300">
                {student.assignedSubjects.length} subject{student.assignedSubjects.length !== 1 && "s"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected?.studentName ?? ""} wide>
        {selected && (
          <div className="flex flex-col gap-4">
            {selected.studentId && (
              <p className="font-body text-sm text-slate-500 dark:text-slate-400">
                Student ID: {selected.studentId}
              </p>
            )}
            {selected.assignedSubjects.map((subject) => (
              <div key={subject.subjectId} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                <h4 className="font-body text-sm font-medium text-navy-800 dark:text-mist-100">
                  {subject.subjectCode} — {subject.descTitle}
                </h4>
                <table className="mt-2 w-full text-left font-body text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10">
                      <th className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Day</th>
                      <th className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Time</th>
                      <th className="hidden px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:table-cell">Room</th>
                      <th className="hidden px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:table-cell">Instructor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {subject.schedules.map((sched) => (
                      <tr key={sched.regularSchedId}>
                        <td className="px-2 py-1.5 text-slate-600 dark:text-slate-300">
                          {sched.dayOfWeek}
                        </td>
                        <td className="px-2 py-1.5 text-slate-600 dark:text-slate-300">
                          {sched.startTime} - {sched.endTime}
                        </td>
                        <td className="hidden px-2 py-1.5 text-slate-500 dark:text-slate-400 sm:table-cell">
                          {sched.room ?? "—"}
                        </td>
                        <td className="hidden px-2 py-1.5 text-slate-500 dark:text-slate-400 sm:table-cell">
                          {sched.instructor ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
