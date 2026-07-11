import { Badge } from "~/components/ui/badge";
import type { RoleSummary } from "~/types/role";

/** Card per system role: name and how many permissions it holds. */
export function RoleTable({ roles }: { roles: RoleSummary[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => (
        <div
          key={role.id}
          className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl tracking-wide text-navy-700 dark:text-white">
              {role.name}
            </h2>
            <Badge tone="slate">
              {role.permissions.length}{" "}
              {role.permissions.length === 1 ? "permission" : "permissions"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
