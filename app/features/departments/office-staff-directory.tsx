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
import { UserIcon } from "~/components/ui/icons";
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
              <div className="flex items-center gap-3">
                {member.profilePhotoUrl ? (
                  <img
                    src={member.profilePhotoUrl}
                    alt=""
                    className="size-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-mist-100 dark:bg-white dark:text-navy-800">
                    <UserIcon />
                  </span>
                )}
                <span className="font-medium text-navy-700 dark:text-mist-100">
                  {displayName(member)}
                </span>
              </div>
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
