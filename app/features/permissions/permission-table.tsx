import { Badge } from "~/components/ui/badge";
import { IconButton } from "~/components/ui/icon-button";
import { ShieldUserIcon } from "~/components/ui/icons";
import type { PermissionSummary } from "~/types/permission";

type PermissionTableProps = {
  roles: PermissionSummary[];
  onAssign: (role: PermissionSummary) => void;
};

/** Card per system role with its permission count and assignment action. */
export function PermissionTable({ roles, onAssign }: PermissionTableProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => (
        <div
          key={role.id}
          className="group rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
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
              <div className="lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                <IconButton
                  onClick={() => onAssign(role)}
                  label={`Assign permissions to ${role.name}`}
                  title="Assign permissions"
                >
                  <ShieldUserIcon />
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
