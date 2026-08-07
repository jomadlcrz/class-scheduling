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
import { AdministratorRoleBadge } from "~/features/administrators/role-badge";
import type { Administrator } from "~/types/administrator";

function displayName(admin: Administrator) {
  const parts = [admin.firstName, admin.midName].filter(Boolean).join(" ");
  return parts ? `${admin.lastName}, ${parts}` : admin.lastName;
}

type AdministratorTableProps = {
  administrators: Administrator[];
  /** Per-row login status fetched from GET /super-admin/admin-accounts/<id> (the list endpoint doesn't include it); undefined while still loading. */
  accountActiveById: Record<number, boolean | undefined>;
  onEdit: (admin: Administrator) => void;
  onDeactivate: (admin: Administrator) => void;
  onReactivate: (admin: Administrator) => void;
};

export function AdministratorTable({
  administrators,
  accountActiveById,
  onEdit,
  onDeactivate,
  onReactivate,
}: AdministratorTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Email</TableHeader>
        <TableHeader>Department</TableHeader>
        <TableHeader>Role</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {administrators.map((admin) => {
          const isActive = accountActiveById[admin.id];
          return (
            <TableRow key={admin.id}>
              <TableCell>
                <span className="font-medium text-navy-700 dark:text-mist-100">
                  {displayName(admin)}
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
              <TableCell>
                <div className="flex justify-end gap-1">
                  <IconButton
                    onClick={() => onEdit(admin)}
                    label={`Edit ${admin.firstName} ${admin.lastName}`}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  {admin.roleName !== "Super Admin" && (
                    isActive === undefined ? (
                      <span className="grid size-8 place-items-center text-slate-300 dark:text-slate-600">…</span>
                    ) : isActive ? (
                      <IconButton
                        onClick={() => onDeactivate(admin)}
                        label={`Deactivate ${admin.firstName} ${admin.lastName}`}
                        title="Deactivate"
                      >
                        <UserOffIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        onClick={() => onReactivate(admin)}
                        label={`Reactivate ${admin.firstName} ${admin.lastName}`}
                        title="Reactivate"
                      >
                        <UserCheckIcon />
                      </IconButton>
                    )
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
