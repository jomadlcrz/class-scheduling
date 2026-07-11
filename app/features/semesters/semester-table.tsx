import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { Semester } from "~/types/semester";

type SemesterTableProps = {
  semesters: Semester[];
};

export function SemesterTable({ semesters }: SemesterTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Semester</TableHeader>
        <TableHeader>Number</TableHeader>
      </TableHead>
      <TableBody>
        {semesters.map((sem) => (
          <TableRow key={sem.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">
                {sem.semester}
              </span>
            </TableCell>
            <TableCell>{sem.semesterNumber}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
