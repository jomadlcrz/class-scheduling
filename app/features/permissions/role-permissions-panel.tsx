import { CheckIcon } from "~/components/ui/icons";
import type { PermissionSummary } from "~/types/permission";

type RolePermissionsPanelProps = {
  role: PermissionSummary | undefined;
};

/** Preview of the permissions granted to the selected account role. */
export function RolePermissionsPanel({ role }: RolePermissionsPanelProps) {
  return (
    <aside className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
        Role Permissions
      </h3>
      {role ? (
        <ul className="mt-3 flex flex-col gap-2.5">
          {role.permissions.map((permission) => (
            <li key={permission.id} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true">
                <CheckIcon />
              </span>
              <span>
                <span className="block text-sm font-medium text-navy-700 dark:text-mist-100">
                  {permission.description || permission.slug}
                </span>
                <span className="block text-xs text-slate-400 dark:text-slate-500">
                  {permission.slug}
                </span>
              </span>
            </li>
          ))}
          {role.permissions.length === 0 && (
            <li className="text-sm text-slate-500 dark:text-slate-400">
              This role has no permissions assigned.
            </li>
          )}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Select a role to see what it can do.
        </p>
      )}
    </aside>
  );
}
