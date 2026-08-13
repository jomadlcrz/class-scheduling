import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { TableSkeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { administratorService } from "~/services/administrator.service";

export function meta() {
  return [{ title: "Accounts — GWC Class Scheduling" }];
}

export default function AccountsRoute() {
  return <RoleGuard allow={["admin"]}><AccountsPage /></RoleGuard>;
}

function AccountsPage() {
  const { data, error } = useCachedData("system-accounts", () => administratorService.listAccounts());
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader title="All Accounts" />
      <div className="mt-6">
        {error && data === null ? <EmptyState title="Unable to load accounts">{error}</EmptyState> : data === null ? (
          <TableSkeleton columns={4} rows={8} />
        ) : data.items.length === 0 ? <EmptyState title="No accounts found" /> : (
          <Table>
            <TableHead><TableHeader>Email</TableHeader><TableHeader>Roles</TableHeader><TableHeader>Status</TableHeader><TableHeader>First login</TableHeader></TableHead>
            <TableBody>{data.items.map((account) => (
              <TableRow key={account.userId}>
                <TableCell>{account.email ?? "—"}</TableCell>
                <TableCell>{account.roles.join(", ") || "—"}</TableCell>
                <TableCell><Badge tone={account.active ? "emerald" : "red"}>{account.active ? "Active" : "Deactivated"}</Badge></TableCell>
                <TableCell>{account.pendingFirstLogin ? <Badge tone="gold">Pending</Badge> : "—"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
