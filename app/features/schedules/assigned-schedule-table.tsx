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
              <div key={subject.subjectId} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                    {subject.subjectCode} — {subject.descTitle}
                  </p>
                  <span className="shrink-0 font-body text-xs text-slate-500 dark:text-slate-400">
                    {subject.units} unit{subject.units !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableHeader dense>Day</TableHeader>
                      <TableHeader dense>Time</TableHeader>
                      <TableHeader dense className="hidden sm:table-cell">Room</TableHeader>
                      <TableHeader dense className="hidden sm:table-cell">Instructor</TableHeader>
                      <TableHeader dense className="hidden sm:table-cell">Set</TableHeader>
                    </TableHead>
                    <TableBody>
                      {subject.schedules.map((sched) => (
                        <TableRow key={sched.id}>
                          <TableCell dense>{sched.dayOfWeek}</TableCell>
                          <TableCell dense>{sched.startTime} - {sched.endTime}</TableCell>
                          <TableCell dense className="hidden sm:table-cell">{sched.room ?? "—"}</TableCell>
                          <TableCell dense className="hidden sm:table-cell">{sched.instructor ?? "—"}</TableCell>
                          <TableCell dense className="hidden sm:table-cell">{sched.set ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
