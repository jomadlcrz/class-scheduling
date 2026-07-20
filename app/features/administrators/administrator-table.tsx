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

type AdministratorTableProps = {
  administrators: Administrator[];
};

export function AdministratorTable({ administrators }: AdministratorTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Email</TableHeader>
        <TableHeader>Department</TableHeader>
        <TableHeader>Role</TableHeader>
      </TableHead>
      <TableBody>
        {administrators.map((admin) => (
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
              {admin.departmentCode || "—"}
            </TableCell>
            <TableCell>
              <AdministratorRoleBadge role={admin.roleName} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
