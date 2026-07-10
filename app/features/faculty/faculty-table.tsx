import { Badge } from "~/components/ui/badge";
import { EditIcon, UserCheckIcon, UserOffIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  FACULTY_STATUS_LABELS,
  FACULTY_STATUS_TONES,
  type Faculty,
} from "~/types/faculty";

type FacultyTableProps = {
  faculty: Faculty[];
  onEdit: (member: Faculty) => void;
  onToggleStatus: (member: Faculty) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function FacultyTable({ faculty, onEdit, onToggleStatus }: FacultyTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Email</TableHeader>
        <TableHeader>Department</TableHeader>
        <TableHeader className="hidden md:table-cell">Specialization</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {faculty.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">
                {member.lastName}, {member.firstName}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
              {member.email}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <img
                  src={`/images/departments/${member.departmentCode.toLowerCase()}.avif`}
                  alt={`${member.departmentCode} logo`}
                  className="size-8 rounded-lg object-contain"
                />
                <span className="text-slate-600 dark:text-slate-300">{member.departmentCode}</span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">{member.specialization}</TableCell>
            <TableCell>
              <Badge tone={FACULTY_STATUS_TONES[member.status]}>
                {FACULTY_STATUS_LABELS[member.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(member)}
                  aria-label={`Edit ${member.firstName} ${member.lastName}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStatus(member)}
                  aria-label={
                    member.status === "active"
                      ? `Deactivate ${member.firstName} ${member.lastName}`
                      : `Activate ${member.firstName} ${member.lastName}`
                  }
                  title={member.status === "active" ? "Deactivate" : "Activate"}
                  className={actionButtonClassName}
                >
                  {member.status === "active" ? <UserOffIcon /> : <UserCheckIcon />}
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
