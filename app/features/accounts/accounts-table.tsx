import { Badge } from "~/components/ui/badge";
import { IconButton } from "~/components/ui/icon-button";
import { UserCheckIcon, UserOffIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { AccountRoleBadge } from "~/features/accounts/account-role-badge";
import { formatDateTime } from "~/lib/time";
import type { Account } from "~/types/account";

type AccountsTableProps = {
  accounts: Account[];
  /** When true, the last column shows the deactivation timestamp (deactivated tab). */
  showDeactivatedAt?: boolean;
  onDeactivate: (account: Account) => void;
  onReactivate: (account: Account) => void;
};

/** Unified account browse table — email, role badges, and a status/pending or deactivated column. */
export function AccountsTable({
  accounts,
  showDeactivatedAt = false,
  onDeactivate,
  onReactivate,
}: AccountsTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Email</TableHeader>
        <TableHeader>Roles</TableHeader>
        <TableHeader>{showDeactivatedAt ? "Deactivated" : "Status"}</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {accounts.map((account) => (
          <TableRow key={account.userId}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">{account.email}</span>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1.5">
                {account.roles.length > 0 ? (
                  account.roles.map((role) => <AccountRoleBadge key={role} role={role} />)
                ) : (
                  <span className="font-body text-xs text-slate-400 dark:text-slate-500">No roles</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {showDeactivatedAt ? (
                <span className="font-body text-sm text-slate-500 dark:text-slate-400">
                  {account.deactivatedAt ? formatDateTime(account.deactivatedAt) : "—"}
                </span>
              ) : account.pendingFirstLogin ? (
                <Badge tone="gold">Pending first login</Badge>
              ) : (
                <Badge tone="emerald">Active</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                {showDeactivatedAt ? (
                  <IconButton
                    variant="dangerSoft"
                    onClick={() => onReactivate(account)}
                    label={`Reactivate ${account.email}`}
                    title="Reactivate"
                  >
                    <UserCheckIcon />
                  </IconButton>
                ) : (
                  <IconButton
                    variant="dangerSoft"
                    onClick={() => onDeactivate(account)}
                    label={`Deactivate ${account.email}`}
                    title="Deactivate"
                  >
                    <UserOffIcon />
                  </IconButton>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
