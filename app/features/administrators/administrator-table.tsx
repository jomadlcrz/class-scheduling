import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { EditIcon, UserCheckIcon, UserOffIcon } from "~/components/ui/icons";
import { AdministratorRoleBadge } from "~/features/administrators/role-badge";
import type { Administrator } from "~/types/administrator";

type AdministratorTableProps = {
  administrators: Administrator[];
  /** Per-row login status fetched from GET /super-admin/admin-accounts/<id> (the list endpoint doesn't include it); undefined while still loading. */
  accountActiveById: Record<number, boolean | undefined>;
  onEdit: (admin: Administrator) => void;
  onDeactivate: (admin: Administrator) => void;
  onReactivate: (admin: Administrator) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

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
              <TableCell>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(admin)}
                    aria-label={`Edit ${admin.firstName} ${admin.lastName}`}
                    title="Edit"
                    className={actionButtonClassName}
                  >
                    <EditIcon />
                  </button>
                  {isActive === undefined ? (
                    <span className="grid size-8 place-items-center text-slate-300 dark:text-slate-600">…</span>
                  ) : isActive ? (
                    <button
                      type="button"
                      onClick={() => onDeactivate(admin)}
                      aria-label={`Deactivate ${admin.firstName} ${admin.lastName}`}
                      title="Deactivate"
                      className={actionButtonClassName}
                    >
                      <UserOffIcon />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onReactivate(admin)}
                      aria-label={`Reactivate ${admin.firstName} ${admin.lastName}`}
                      title="Reactivate"
                      className={actionButtonClassName}
                    >
                      <UserCheckIcon />
                    </button>
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
