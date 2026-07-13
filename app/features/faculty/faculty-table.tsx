import { departmentLogoUrl, onDepartmentLogoError } from "~/lib/department-logo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { Faculty } from "~/types/faculty";

type FacultyTableProps = {
  faculty: Faculty[];
};

export function FacultyTable({ faculty }: FacultyTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Email</TableHeader>
        <TableHeader className="hidden lg:table-cell">Mobile</TableHeader>
        <TableHeader>Department</TableHeader>
        <TableHeader>Role</TableHeader>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
