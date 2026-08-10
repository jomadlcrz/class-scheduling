import { EmptyState } from "~/components/feedback/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { AccountRoleBadge } from "~/features/accounts/account-role-badge";
import type { OfficeStaffMember } from "~/types/department";

function displayName(member: OfficeStaffMember) {
  const parts = [member.firstName, member.midName].filter(Boolean).join(" ");
  return parts ? `${member.lastName}, ${parts}` : member.lastName;
}

/** Administrative-department staff directory — name, role, and contact. */
export function OfficeStaffDirectory({ staff }: { staff: OfficeStaffMember[] }) {
  if (staff.length === 0) {
    return (
      <EmptyState title="No office staff">
        No staff members are assigned to this office yet.
      </EmptyState>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Role</TableHeader>
        <TableHeader className="hidden md:table-cell">Email</TableHeader>
        <TableHeader className="hidden md:table-cell">Mobile</TableHeader>
      </TableHead>
      <TableBody>
        {staff.map((member) => (
          <TableRow key={member.key}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">
                {displayName(member)}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <AccountRoleBadge role={member.roleName} />
            </TableCell>
            <TableCell className="hidden text-slate-500 dark:text-slate-400 md:table-cell">
              {member.email || "—"}
            </TableCell>
            <TableCell className="hidden text-slate-500 dark:text-slate-400 md:table-cell">
              {member.mobile || "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
