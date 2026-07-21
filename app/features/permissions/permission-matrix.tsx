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

type PermissionMatrixProps = {
  roles: PermissionSummary[];
  /** Every permission that exists, granted or not (GET /permissions) — not just the ones already granted. */
  catalog: RolePermission[];
  onRevoke: (roleId: number, permissionId: number) => void;
};

/** Permissions × roles grid showing what each system role can do. */
export function PermissionMatrix({ roles, catalog, onRevoke }: PermissionMatrixProps) {
  const permissions = [...catalog].sort((a, b) => a.slug.localeCompare(b.slug));

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
            {roles.map((role) => {
              const granted = role.permissions.some((p) => p.id === permission.id);
              return (
                <TableCell key={role.id}>
                  {granted ? (
                    <button
                      type="button"
                      onClick={() => onRevoke(role.id, permission.id)}
                      aria-label={`Revoke ${permission.slug} from ${role.name}`}
                      title="Click to revoke"
                      className="cursor-pointer text-emerald-500 transition-colors duration-150 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <CheckIcon />
                    </button>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600" aria-label="Not allowed">
                      —
                    </span>
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
