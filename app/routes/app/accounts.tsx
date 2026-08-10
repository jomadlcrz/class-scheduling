import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Pagination } from "~/components/ui/pagination";
import { TableSkeleton } from "~/components/ui/skeleton";
import { TabList } from "~/components/ui/tabs";
import { AccountsTable } from "~/features/accounts/accounts-table";
import { DeactivateAccountDialog } from "~/features/accounts/deactivate-account-dialog";
import { ReactivateAccountDialog } from "~/features/accounts/reactivate-account-dialog";
import { useCachedData } from "~/hooks/use-cached-data";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { administratorService } from "~/services/administrator.service";
import type { Account } from "~/types/account";

type AccountTab = "active" | "deactivated";

export function meta() {
  return [
    { title: "All Accounts — GWC Class Scheduling" },
    { name: "description", content: "Browse every login account across all roles." },
  ];
}

export default function AccountsRoute() {
  return (
    <RoleGuard allow={["admin"]}>
      <AccountsPage />
    </RoleGuard>
  );
}

const statCardClassName =
  "rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5";

function AccountsPage() {
  const { data, error: loadError, reload } = useCachedData("accounts", () =>
    administratorService.listAccounts(),
  );
  const [tab, setTab] = useState<AccountTab>("active");
  const [search, setSearch] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<Account | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<Account | null>(null);

  const counts = data?.counts;
  const accounts: Account[] = tab === "active" ? data?.active ?? [] : data?.deactivated ?? [];

  const visibleAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((account) => account.email.toLowerCase().includes(query));
  }, [accounts, search]);

  const pagination = usePagination(visibleAccounts, `${tab}|${search}`);

  async function handleDeactivate(account: Account) {
    const message = await administratorService.deactivateAccount(account.userId);
    if (message) toast.success(message);
    setDeactivateTarget(null);
    await reload();
  }

  async function handleReactivate(account: Account) {
    const message = await administratorService.reactivateAccount(account.userId);
    if (message) toast.success(message);
    setReactivateTarget(null);
    await reload();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader title="All Accounts" />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={statCardClassName}>
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Active
          </p>
          <p className="mt-1 font-display text-2xl tracking-wide text-navy-800 dark:text-mist-100">
            {counts?.active ?? "—"}
          </p>
        </div>
        <div className={statCardClassName}>
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Deactivated
          </p>
          <p className="mt-1 font-display text-2xl tracking-wide text-navy-800 dark:text-mist-100">
            {counts?.deactivated ?? "—"}
          </p>
        </div>
        <div className={statCardClassName}>
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Total
          </p>
          <p className="mt-1 font-display text-2xl tracking-wide text-navy-800 dark:text-mist-100">
            {counts?.total ?? "—"}
          </p>
        </div>
        <div className={statCardClassName}>
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Pending first login
          </p>
          <p className="mt-1 font-display text-2xl tracking-wide text-navy-800 dark:text-mist-100">
            {counts?.pendingFirstLogin ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <TabList
            ariaLabel="Account status"
            tabs={[
              { value: "active" as AccountTab, label: `Active${counts ? ` (${counts.active})` : ""}` },
              { value: "deactivated" as AccountTab, label: `Deactivated${counts ? ` (${counts.deactivated})` : ""}` },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div className="relative w-full sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="accounts-search"
              type="search"
              placeholder="Email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search accounts by email"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>
        </div>

        {loadError && data === null ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : data === null ? (
          <TableSkeleton columns={3} rows={8} />
        ) : visibleAccounts.length === 0 ? (
          <EmptyState title="No accounts found">
            {tab === "active"
              ? "No active accounts match the current search."
              : "No deactivated accounts match the current search."}
          </EmptyState>
        ) : (
          <>
            <AccountsTable
              accounts={pagination.pageItems}
              showDeactivatedAt={tab === "deactivated"}
              onDeactivate={setDeactivateTarget}
              onReactivate={setReactivateTarget}
            />
            <Pagination
              page={pagination.page}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
            />
          </>
        )}
      </div>

      <DeactivateAccountDialog
        account={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />

      <ReactivateAccountDialog
        account={reactivateTarget}
        onClose={() => setReactivateTarget(null)}
        onConfirm={handleReactivate}
      />
    </div>
  );
}
