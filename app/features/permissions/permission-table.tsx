import { Badge } from "~/components/ui/badge";
import { EditIcon, ShieldUserIcon } from "~/components/ui/icons";
import type { PermissionSummary } from "~/types/permission";

type PermissionTableProps = {
  roles: PermissionSummary[];
  onEdit: (role: PermissionSummary) => void;
  onAssign: (role: PermissionSummary) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

/** Card per system role: name, how many permissions it holds, and edit/assign actions. */
export function PermissionTable({ roles, onEdit, onAssign }: PermissionTableProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => (
        <div
          key={role.id}
          className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl tracking-wide text-navy-700 dark:text-mist-100">
              {role.name}
            </h2>
            <div className="flex items-center gap-2">
              <Badge tone="slate">
                {role.permissions.length}{" "}
                {role.permissions.length === 1 ? "permission" : "permissions"}
              </Badge>
              <button
                type="button"
                onClick={() => onAssign(role)}
                aria-label={`Assign permissions to ${role.name}`}
                title="Assign permissions"
                className={actionButtonClassName}
              >
                <ShieldUserIcon />
              </button>
              <button
                type="button"
                onClick={() => onEdit(role)}
                aria-label={`Update Permissions for ${role.name}`}
                title="Update Permissions"
                className={actionButtonClassName}
              >
                <EditIcon />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
