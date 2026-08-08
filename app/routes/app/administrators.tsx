import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Button } from "~/components/ui/button";
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
  const { data: administrators, error: loadError, reload: refresh } = useCachedData(
    "administrators",
    () => administratorService.list(),
  );
  const [search, setSearch] = useState("");

  const [editTarget, setEditTarget] = useState<Administrator | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Administrator | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<Administrator | null>(null);
  // The list endpoint has no account_active field — fetched per-row (page-bounded
  // by pagination) so Deactivate/Reactivate can show only the one that applies.
  const [accountActiveById, setAccountActiveById] = useState<Record<number, boolean | undefined>>({});

  const visibleAdministrators = useMemo(() => {
    if (!administrators) return [];
    const query = search.trim().toLowerCase();
    return administrators
      .filter((admin) => {
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
  }, [administrators, search]);

  const pagination = usePagination(visibleAdministrators, search);
  const pageIds = pagination.pageItems.map((a) => a.id).join(",");

  useEffect(() => {
    if (!pageIds) return;
    const ids = pageIds.split(",").map(Number);
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        administratorService
          .get(id)
          .then((detail) => [id, detail.accountActive ?? true] as const)
          .catch(() => [id, true] as const),
      ),
    ).then((results) => {
      if (cancelled) return;
      setAccountActiveById((current) => ({ ...current, ...Object.fromEntries(results) }));
    });
    return () => {
      cancelled = true;
    };
  }, [pageIds]);

  async function handleEdit(input: { firstName: string; midName?: string | null; lastName: string; mobile: string; email: string }) {
    if (!editTarget) return;
    const message = await administratorService.update(editTarget.id, input);
    if (message) toast.success(message);
    setEditTarget(null);
    refresh();
  }

  async function handleDeactivate(admin: Administrator) {
    const message = await administratorService.deactivate(admin.id);
    if (message) toast.success(message);
    setAccountActiveById((current) => ({ ...current, [admin.id]: false }));
    setDeactivateTarget(null);
  }

  async function handleReactivate(admin: Administrator) {
    const message = await administratorService.reactivate(admin.id);
    if (message) toast.success(message);
    setAccountActiveById((current) => ({ ...current, [admin.id]: true }));
    setReactivateTarget(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
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
          <div className="relative ml-auto w-full sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="administrator-search"
              type="search"
              placeholder="Name or email…"
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
          <EmptyState title="No administrators found">
            No administrators match the current search. Adjust the search or add a new administrator.
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
