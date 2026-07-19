import { Badge } from "~/components/ui/badge";
import { KeyIcon, UserCheckIcon, UserOffIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { AdministratorRoleBadge } from "~/features/administrators/role-badge";
import type { Administrator } from "~/types/administrator";
import type { DepartmentOption } from "~/types/department";

type AdministratorTableProps = {
  administrators: Administrator[];
  departments: DepartmentOption[];
  onResetPassword: (admin: Administrator) => void;
  onToggleStatus: (admin: Administrator) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function AdministratorTable({
  administrators,
  departments,
  onResetPassword,
  onToggleStatus,
}: AdministratorTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Email</TableHeader>
        <TableHeader>Department</TableHeader>
        <TableHeader>Role</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {administrators.map((admin) => {
          const department = departments.find((d) => d.id === admin.departmentId);
          const fullName = `${admin.firstName} ${admin.lastName}`;
          return (
            <TableRow key={admin.id}>
              <TableCell>
                <span className="font-medium text-navy-700 dark:text-mist-100">
                  {admin.lastName}, {admin.firstName}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
                {admin.email}
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-300">
                {department ? `${department.code} — ${department.name}` : "—"}
              </TableCell>
              <TableCell>
                <AdministratorRoleBadge role={admin.roleName} />
              </TableCell>
              <TableCell>
                {admin.isActive ? (
                  <Badge tone="emerald">Active</Badge>
                ) : (
                  <Badge tone="red">Inactive</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onResetPassword(admin)}
                    aria-label={`Reset password for ${fullName}`}
                    title="Reset password"
                    className={actionButtonClassName}
                  >
                    <KeyIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(admin)}
                    aria-label={admin.isActive ? `Deactivate ${fullName}` : `Activate ${fullName}`}
                    title={admin.isActive ? "Deactivate" : "Activate"}
                    className={actionButtonClassName}
                  >
                    {admin.isActive ? <UserOffIcon /> : <UserCheckIcon />}
                  </button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
