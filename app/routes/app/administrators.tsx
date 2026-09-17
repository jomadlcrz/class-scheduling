import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Button } from "~/components/ui/button";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { TableSkeleton } from "~/components/ui/skeleton";
import { ActivateAdministratorDialog } from "~/features/administrators/activate-administrator-dialog";
import { AdministratorEditForm } from "~/features/administrators/administrator-edit-form";
import { AdministratorTable } from "~/features/administrators/administrator-table";
import { DeactivateAdministratorDialog } from "~/features/administrators/deactivate-administrator-dialog";
import { useCachedData } from "~/hooks/use-cached-data";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { administratorService } from "~/services/administrator.service";
import type { Administrator } from "~/types/administrator";

export function meta() {
  return [
    { title: "Administrators — GWC Class Scheduling" },
    { name: "description", content: "Manage Super Admin and Registrar Admin accounts." },
  ];
}

export default function AdministratorsRoute() {
  return (
    <RoleGuard allow={["admin"]}>
      <AdministratorsPage />
    </RoleGuard>
  );
}

function AdministratorsPage() {
  const navigate = useNavigate();
  const { data: administrators, error: loadError, reload: reloadAdministrators } = useCachedData(
    "administrators",
    () => administratorService.list(),
  );
  const { data: systemAccounts, reload: reloadSystemAccounts } = useCachedData(
    "system-accounts",
    () => administratorService.listAccounts(),
  );
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  const [editTarget, setEditTarget] = useState<Administrator | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Administrator | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<Administrator | null>(null);

  // The list endpoint returns account_active and has_account directly;
  // systemAccounts provides a live fallback when available.
  const accountActiveById = useMemo<Record<number, boolean>>(() => {
    const byEmail = new Map(
      (systemAccounts?.items ?? [])
        .filter((account) => account.email)
        .map((account) => [account.email!.trim().toLowerCase(), account.active]),
    );
    return Object.fromEntries(
      (administrators ?? []).map((admin) => {
        let active: boolean | undefined =
          typeof admin.accountActive === "boolean" ? admin.accountActive : undefined;
        if (active === undefined && admin.email) {
          active = byEmail.get(admin.email.trim().toLowerCase());
        }
        return [admin.id, active ?? true];
      }),
    );
  }, [administrators, systemAccounts]);

  const visibleAdministrators = useMemo(() => {
    if (!administrators) return [];
    const query = search.trim().toLowerCase();
    return administrators
      .filter((admin) => {
        if (role !== "all" && admin.roleName !== role) return false;
        if (status === "active" && accountActiveById[admin.id] === false) return false;
        if (status === "deactivated" && accountActiveById[admin.id] !== false) return false;
        if (
          query &&
          !admin.firstName.toLowerCase().includes(query) &&
          !admin.lastName.toLowerCase().includes(query) &&
          !(admin.email ?? "").toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }, [administrators, search, role, status, accountActiveById]);

  const pagination = usePagination(visibleAdministrators, `${search}|${role}|${status}`);

  async function handleEdit(input: {
    firstName: string;
    midName?: string | null;
    lastName: string;
    mobile: string;
    email: string;
    prefixHonorific?: string;
    academicRank?: string | null;
  }) {
    if (!editTarget) return;
    const message = await administratorService.update(editTarget.id, input);
    if (message) toast.success(message);
    setEditTarget(null);
    await Promise.all([reloadAdministrators(), reloadSystemAccounts()]);
  }

  async function handleDeactivate(admin: Administrator, reason: string) {
    const message = await administratorService.deactivate(admin.id, reason);
    if (message) toast.success(message);
    await reloadSystemAccounts();
    setDeactivateTarget(null);
  }

  async function handleReactivate(admin: Administrator, reason: string) {
    const message = await administratorService.reactivate(admin.id, reason);
    if (message) toast.success(message);
    await reloadSystemAccounts();
    setReactivateTarget(null);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Administrators"
        actions={
          <Button type="button" block={false} onClick={() => navigate("/administrators/new")}>
            <PlusIcon />
            New Administrator
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <FilterDropdown
            id="admin-role-filter"
            label="Role"
            allLabel="All"
            options={[
              { value: "Super Admin", label: "Super Admin" },
              { value: "Registrar Admin", label: "Registrar Admin" },
            ]}
            value={role}
            onChange={setRole}
          />
          <FilterDropdown
            id="admin-status-filter"
            label="Status"
            allLabel="All"
            options={[
              { value: "active", label: "Active" },
              { value: "deactivated", label: "Deactivated" },
            ]}
            value={status}
            onChange={setStatus}
          />
          <div className="relative ml-auto w-full sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="administrator-search"
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>
        </div>

        {loadError && administrators === null ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : administrators === null ? (
          <TableSkeleton columns={5} rows={8} />
        ) : visibleAdministrators.length === 0 ? (
          <EmptyState title={search.trim() || role !== "all" || status !== "all" ? "No administrators found" : "No administrators yet"}>
            {search.trim() || role !== "all" || status !== "all"
              ? "No administrators match the current search and filters."
              : "Add an administrator to get started."}
          </EmptyState>
        ) : (
          <>
            <AdministratorTable
              administrators={pagination.pageItems}
              accountActiveById={accountActiveById}
              onEdit={setEditTarget}
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

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Administrator">
        {editTarget && (
          <AdministratorEditForm administrator={editTarget} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} />
        )}
      </Modal>

      <DeactivateAdministratorDialog
        admin={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />

      <ActivateAdministratorDialog
        admin={reactivateTarget}
        onClose={() => setReactivateTarget(null)}
        onConfirm={handleReactivate}
      />
    </div>
  );
}
