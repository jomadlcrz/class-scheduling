import { CheckIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { RolePermission, PermissionSummary } from "~/types/permission";

/** Permissions × roles grid showing what each system role can do. */
export function PermissionMatrix({ roles }: { roles: PermissionSummary[] }) {
  // The catalog is the union of every permission the roles hold.
  const catalog = new Map<string, RolePermission>();
  for (const role of roles) {
    for (const permission of role.permissions) {
      if (!catalog.has(permission.slug)) catalog.set(permission.slug, permission);
    }
  }
  const permissions = [...catalog.values()].sort((a, b) => a.slug.localeCompare(b.slug));

  return (
    <Table>
      <TableHead>
        <TableHeader>Permission</TableHeader>
        {roles.map((role) => (
          <TableHeader key={role.id}>{role.name}</TableHeader>
        ))}
      </TableHead>
      <TableBody>
        {permissions.map((permission) => (
          <TableRow key={permission.slug}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">
                {permission.description || permission.slug}
              </span>
              <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">
                {permission.slug}
              </span>
            </TableCell>
            {roles.map((role) => (
              <TableCell key={role.id}>
                {role.permissions.some((p) => p.slug === permission.slug) ? (
                  <span className="text-emerald-500" aria-label="Allowed">
                    <CheckIcon />
                  </span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600" aria-label="Not allowed">
                    —
                  </span>
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
