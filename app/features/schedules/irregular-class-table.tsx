import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { SubjectBadgeList } from "~/features/schedules/irregular-student-badges";
import type { IrregularStudent } from "~/services/irregular-class.service";

type IrregularClassTableProps = {
  students: IrregularStudent[];
};

export function IrregularClassTable({ students }: IrregularClassTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Student ID</TableHeader>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Program</TableHeader>
        <TableHeader>Enrolled Subjects</TableHeader>
      </TableHead>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.studentId}>
            <TableCell className="font-medium text-navy-700 dark:text-white">
              {student.studentId}
            </TableCell>
            <TableCell>{student.studentName}</TableCell>
            <TableCell className="hidden sm:table-cell">{student.programTaken}</TableCell>
            <TableCell>
              <SubjectBadgeList subjects={student.subjectsEnrolled} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
