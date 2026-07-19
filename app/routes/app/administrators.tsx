import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { ActivateAdministratorDialog } from "~/features/administrators/activate-administrator-dialog";
import { AdministratorAccountForm } from "~/features/administrators/administrator-account-form";
import { AdministratorTable } from "~/features/administrators/administrator-table";
import { DeactivateAdministratorDialog } from "~/features/administrators/deactivate-administrator-dialog";
import { ResetPasswordDialog } from "~/features/administrators/reset-password-dialog";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { administratorService } from "~/services/administrator.service";
import { departmentService } from "~/services/department.service";
import type { Administrator, CreateAdministratorAccountInput } from "~/types/administrator";
import type { DepartmentOption } from "~/types/department";

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
  const [administrators, setAdministrators] = useState<Administrator[] | null>(null);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<Administrator | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Administrator | null>(null);
  const [activateTarget, setActivateTarget] = useState<Administrator | null>(null);

  function refresh() {
    administratorService
      .list()
      .then(setAdministrators)
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load administrators.");
        setAdministrators([]);
      });
  }

  useEffect(() => {
    refresh();
    departmentService
      .list()
      .then((departments) => setDepartmentOptions(departments.map((d) => ({ id: d.id, code: d.code, name: d.name }))))
      .catch(() => setDepartmentOptions([]));
  }, []);

  const visibleAdministrators = useMemo(() => {
    if (!administrators) return [];
    const query = search.trim().toLowerCase();
    return administrators
      .filter((admin) => {
        if (
          query &&
          !admin.firstName.toLowerCase().includes(query) &&
          !admin.lastName.toLowerCase().includes(query) &&
          !admin.email.toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }, [administrators, search]);

  const pagination = usePagination(visibleAdministrators, search);

  async function handleCreate(input: CreateAdministratorAccountInput) {
    const message = await administratorService.create(input);
    if (message) toast.success(message);
    setCreatedEmail(input.email);
    refresh();
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreatedEmail(null);
  }

  async function handleResetPassword(admin: Administrator) {
    const message = await administratorService.resetPassword(admin.id);
    if (message) toast.success(message);
    refresh();
  }

  async function handleToggleStatus(admin: Administrator) {
    const message = admin.isActive
      ? await administratorService.deactivate(admin.id)
      : await administratorService.reactivate(admin.id);
    if (message) toast.success(message);
    refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Administrators"
        description="Super Admin and Registrar Admin accounts."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Administrator
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <Input
          id="administrator-search"
          label="Search"
          type="search"
          placeholder="Name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : administrators === null ? (
          <div
            role="status"
            aria-label="Loading administrators"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleAdministrators.length === 0 ? (
          <EmptyState title="No administrators found">
            No administrators match the current search. Adjust the search or add a new administrator.
          </EmptyState>
        ) : (
          <>
            <AdministratorTable
              administrators={pagination.pageItems}
              departments={departmentOptions}
              onResetPassword={setResetTarget}
              onToggleStatus={(admin) => (admin.isActive ? setDeactivateTarget(admin) : setActivateTarget(admin))}
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

      <Modal open={createOpen} onClose={closeCreate} title="New Administrator">
        {createdEmail ? (
          <div className="flex flex-col items-center gap-4">
            <ResultState tone="success" title="Administrator registered">
              Login credentials with a temporary password will be emailed to {createdEmail}.
            </ResultState>
            <Button type="button" block={false} onClick={closeCreate}>
              <span className="px-4">Done</span>
            </Button>
          </div>
        ) : (
          <AdministratorAccountForm departments={departmentOptions} onSubmit={handleCreate} onCancel={closeCreate} />
        )}
      </Modal>

      <ResetPasswordDialog admin={resetTarget} onClose={() => setResetTarget(null)} onConfirm={handleResetPassword} />
      <DeactivateAdministratorDialog
        admin={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleToggleStatus}
      />
      <ActivateAdministratorDialog
        admin={activateTarget}
        onClose={() => setActivateTarget(null)}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}
