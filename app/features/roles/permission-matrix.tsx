import { CheckIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { PERMISSIONS } from "~/services/role.service";
import type { RoleSummary } from "~/types/role";

/** Permissions × roles grid showing what each system role can do. */
export function PermissionMatrix({ roles }: { roles: RoleSummary[] }) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Permission</TableHeader>
        {roles.map((role) => (
          <TableHeader key={role.role}>{role.label}</TableHeader>
        ))}
      </TableHead>
      <TableBody>
        {PERMISSIONS.map((permission) => (
          <TableRow key={permission.key}>
            <TableCell>{permission.label}</TableCell>
            {roles.map((role) => (
              <TableCell key={role.role}>
                {role.permissions.includes(permission.key) ? (
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
