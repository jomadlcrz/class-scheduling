import { EditIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableActionButton } from "~/features/academic-terms/table-action-button";
import type { Semester } from "~/types/semester";

type SemesterTableProps = {
  semesters: Semester[];
  onEdit: (semester: Semester) => void;
};

export function SemesterTable({ semesters, onEdit }: SemesterTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Semester Number</TableHeader>
        <TableHeader>Display Name</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {semesters.map((sem) => (
          <TableRow key={sem.id}>
            <TableCell>{sem.semesterNumber}</TableCell>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">
                {sem.displayName ?? sem.semester}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <TableActionButton
                  onClick={() => onEdit(sem)}
                  aria-label={`Edit ${sem.displayName ?? sem.semester}`}
                  title={sem.canEdit === false ? "Semester cannot be edited" : undefined}
                  disabled={sem.canEdit === false}
                >
                  <EditIcon />
                  Edit
                </TableActionButton>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
