import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import type { StudentAssignedSchedule } from "~/services/irregular-class.service";

type AssignedScheduleTableProps = {
  students: StudentAssignedSchedule[];
};

/** Flattens each student's assigned subjects/schedules into one row per scheduled session. */
export function AssignedScheduleTable({ students }: AssignedScheduleTableProps) {
  const rows = students.flatMap((student) =>
    student.assignedSubjects.flatMap((subject) =>
      subject.schedules.map((sched) => ({
        key: `${student.studentAcademicId}-${sched.regularSchedId}`,
        studentName: student.studentName,
        studentId: student.studentId,
        subjectCode: subject.subjectCode,
        descTitle: subject.descTitle,
        dayOfWeek: sched.dayOfWeek,
        time: `${sched.startTime} - ${sched.endTime}`,
        room: sched.room,
        instructor: sched.instructor,
      })),
    ),
  );

  return (
    <Table>
      <TableHead>
        <TableHeader>Student</TableHeader>
        <TableHeader>Subject</TableHeader>
        <TableHeader>Day & Time</TableHeader>
        <TableHeader className="hidden sm:table-cell">Room</TableHeader>
        <TableHeader className="hidden lg:table-cell">Instructor</TableHeader>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">{row.studentName}</span>
              {row.studentId && (
                <span className="ml-1 font-body text-xs text-slate-400 dark:text-slate-500">
                  ({row.studentId})
                </span>
              )}
            </TableCell>
            <TableCell className="text-slate-600 dark:text-slate-300">
              {row.subjectCode} — {row.descTitle}
            </TableCell>
            <TableCell className="text-slate-600 dark:text-slate-300">
              {row.dayOfWeek} {row.time}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
              {row.room ?? "—"}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-slate-500 dark:text-slate-400">
              {row.instructor ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
