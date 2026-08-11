import { Badge } from "~/components/ui/badge";
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
        <TableHeader>Administrator</TableHeader>
        <TableHeader>Department</TableHeader>
        <TableHeader>Role</TableHeader>
        <TableHeader>Status</TableHeader>
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
                <div className="min-w-0">
                  <span className="block truncate font-medium text-navy-700 dark:text-mist-100">
                    {displayName(admin)}
                  </span>
                  {admin.email && (
                    <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
                      {admin.email}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-300">
                {admin.departmentCode || "—"}
              </TableCell>
              <TableCell>
                <AdministratorRoleBadge role={admin.roleName} />
              </TableCell>
              <TableCell>
                {isActive === undefined ? (
                  <span className="text-xs text-slate-400 dark:text-slate-500">…</span>
                ) : isActive ? (
                  <Badge tone="emerald">Active</Badge>
                ) : (
                  <Badge tone="red">Deactivated</Badge>
                )}
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
                        variant="dangerSoft"
                        onClick={() => onDeactivate(admin)}
                        label={`Deactivate ${admin.firstName} ${admin.lastName}`}
                        title="Deactivate"
                      >
                        <UserOffIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        variant="emerald"
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
