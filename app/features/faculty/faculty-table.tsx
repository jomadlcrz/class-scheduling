import { departmentLogoUrl, onDepartmentLogoError } from "~/lib/department-logo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { IconButton } from "~/components/ui/icon-button";
import { EditIcon, UserCheckIcon, UserOffIcon } from "~/components/ui/icons";
import type { Faculty } from "~/types/faculty";

function displayName(member: Faculty) {
  const parts = [member.firstName, member.midName].filter(Boolean).join(" ");
  return parts ? `${member.lastName}, ${parts}` : member.lastName;
}

type FacultyTableProps = {
  faculty: Faculty[];
  /** Per-row login status fetched from GET /super-admin/faculty-accounts/<id> (the list endpoint doesn't include it); undefined while still loading. */
  accountActiveById: Record<number, boolean | undefined>;
  onEdit: (member: Faculty) => void;
  onDeactivate: (member: Faculty) => void;
  onReactivate: (member: Faculty) => void;
};

export function FacultyTable({ faculty, accountActiveById, onEdit, onDeactivate, onReactivate }: FacultyTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Email</TableHeader>
        <TableHeader className="hidden lg:table-cell">Mobile</TableHeader>
        <TableHeader>Department</TableHeader>
        <TableHeader>Role</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {faculty.map((member) => {
          const isActive = accountActiveById[member.id];
          return (
          <TableRow key={member.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">
                {displayName(member)}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
              {member.email ?? "—"}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-slate-500 dark:text-slate-400">
              {member.mobile ?? "—"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <img
                  src={departmentLogoUrl(member.departmentCode)}
                  alt={`${member.departmentCode} logo`}
                  onError={onDepartmentLogoError}
                  className="size-8 rounded-lg object-contain"
                />
                <span className="text-slate-600 dark:text-slate-300">{member.departmentCode}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-slate-600 dark:text-slate-300">
                {member.roles.map((r) => r.name).join(", ") || "—"}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <IconButton
                  onClick={() => onEdit(member)}
                  label={`Edit ${member.firstName} ${member.lastName}`}
                  title="Edit"
                >
                  <EditIcon />
                </IconButton>
                {member.hasAccount &&
                  (isActive === undefined ? (
                    <span className="grid size-8 place-items-center text-slate-300 dark:text-slate-600">…</span>
                  ) : isActive ? (
                    <IconButton
                      onClick={() => onDeactivate(member)}
                      label={`Deactivate ${member.firstName} ${member.lastName}`}
                      title="Deactivate"
                    >
                      <UserOffIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      onClick={() => onReactivate(member)}
                      label={`Reactivate ${member.firstName} ${member.lastName}`}
                      title="Reactivate"
                    >
                      <UserCheckIcon />
                    </IconButton>
                  ))}
              </div>
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
