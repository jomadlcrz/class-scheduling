import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { SuccessDone } from "~/components/feedback/success-done";
import { Button } from "~/components/ui/button";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { ActivateFacultyDialog } from "~/features/faculty/activate-faculty-dialog";
import { DeactivateFacultyDialog } from "~/features/faculty/deactivate-faculty-dialog";
import { DepartmentFilterSelect } from "~/features/faculty/department-filter-select";
import { FacultyAccountForm } from "~/features/faculty/faculty-account-form";
import { FacultyEditForm } from "~/features/faculty/faculty-edit-form";
import { FacultyTable } from "~/features/faculty/faculty-table";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { enumService, type EnumOptions } from "~/services/enum.service";
import { facultyService } from "~/services/faculty.service";
import { permissionService } from "~/services/permission.service";
import type { DepartmentOption } from "~/types/department";
import type { CreateFacultyAccountInput, Faculty } from "~/types/faculty";
import type { PermissionSummary } from "~/types/permission";

export function meta() {
  return [
    { title: "Faculty — GWC Class Scheduling" },
    { name: "description", content: "Manage faculty members and their department assignments." },
  ];
}

export default function FacultyRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <FacultyPage />
    </RoleGuard>
  );
}

function FacultyPage() {
  const [facultyList, setFacultyList] = useState<Faculty[] | null>(null);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [enumOptions, setEnumOptions] = useState<EnumOptions | null>(null);
  const [rolePermissions, setRolePermissions] = useState<PermissionSummary[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Faculty | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Faculty | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<Faculty | null>(null);
  // The list endpoint has no account_active field — fetched per-row (page-bounded
  // by pagination) so Deactivate/Reactivate can show only the one that applies.
  const [accountActiveById, setAccountActiveById] = useState<Record<number, boolean | undefined>>({});

  useEffect(() => {
    facultyService.list().then(setFacultyList).catch((err) => {
      setLoadError(err instanceof Error ? err.message : "Unable to load faculty.");
      setFacultyList([]);
    });
    // Real departments + enum values for the account form; failures
    // just leave the dropdowns empty (validation reports the department).
    facultyService
      .listDepartmentOptions()
      .then(setDepartmentOptions)
      .catch(() => setDepartmentOptions([]));
    enumService
      .getOptions()
      .then(setEnumOptions)
      .catch(() => setEnumOptions(null));
    // Role permissions for the account form's side panel; viewers without
    // access (403) simply don't get the panel.
    permissionService
      .list()
      .then(setRolePermissions)
      .catch(() => setRolePermissions([]));
  }, []);

  /** Unique department codes derived from the faculty list. */
  const departmentCodes = useMemo(() => {
    if (!facultyList) return [];
    const codes = new Set(facultyList.map((f) => f.departmentCode));
    return [...codes].sort();
  }, [facultyList]);

  const resetKey = `${search}|${department}`;

  const visibleFaculty = useMemo(() => {
    if (!facultyList) return [];
    const query = search.trim().toLowerCase();
    return facultyList
      .filter((member) => {
        if (department !== "all" && member.departmentCode !== department) return false;
        const hasMatchingRole = member.roles.some((r) => r.name === "Dean" || r.name === "Instructor");
        if (!hasMatchingRole) return false;
        if (
          query &&
          !member.firstName.toLowerCase().includes(query) &&
          !member.lastName.toLowerCase().includes(query) &&
          !(member.email ?? "").toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }, [facultyList, search, department]);

  const pagination = usePagination(visibleFaculty, resetKey);
  const pageAccountIds = pagination.pageItems.filter((f) => f.hasAccount).map((f) => f.id).join(",");

  useEffect(() => {
    if (!pageAccountIds) return;
    const ids = pageAccountIds.split(",").map(Number);
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        facultyService
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
  }, [pageAccountIds]);

  function refreshFacultyList() {
    facultyService.list().then(setFacultyList).catch(() => {});
  }

  async function handleCreate(input: CreateFacultyAccountInput) {
    const message = await facultyService.create(input);
    if (message) toast.success(message);
    setCreatedEmail(input.email);
    refreshFacultyList();
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreatedEmail(null);
  }

  async function handleEdit(input: { firstName: string; midName?: string; lastName: string; mobile: string; email: string }) {
    if (!editTarget) return;
    const message = await facultyService.update(editTarget.id, input);
    if (message) toast.success(message);
    setEditTarget(null);
    refreshFacultyList();
  }

  async function handleDeactivate(member: Faculty) {
    const message = await facultyService.deactivate(member.id);
    if (message) toast.success(message);
    setAccountActiveById((current) => ({ ...current, [member.id]: false }));
    setDeactivateTarget(null);
  }

  async function handleReactivate(member: Faculty) {
    const message = await facultyService.reactivate(member.id);
    if (message) toast.success(message);
    setAccountActiveById((current) => ({ ...current, [member.id]: true }));
    setReactivateTarget(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Instructors & Deans"
        description="Instructors and deans with their department assignments."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Faculty
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <DepartmentFilterSelect
            id="faculty-dept-filter"
            departmentCodes={departmentCodes}
            value={department}
            onValueChange={setDepartment}
          />
          <div className="relative order-first w-full sm:order-0 sm:ml-auto sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="faculty-search"
              type="search"
              placeholder="Name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>
        </div>

        {loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : facultyList === null ? (
          <div
            role="status"
            aria-label="Loading faculty"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleFaculty.length === 0 ? (
          <EmptyState title="No faculty found">
            No faculty match the current filters. Adjust the search or add a new faculty member.
          </EmptyState>
        ) : (
          <>
            <FacultyTable
              faculty={pagination.pageItems}
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

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="New Faculty"
        wide={!createdEmail && rolePermissions.length > 0}
      >
        {createdEmail ? (
          <SuccessDone title="Faculty registered" onDone={closeCreate}>
            Login credentials with a temporary password were emailed to {createdEmail}.
          </SuccessDone>
        ) : (
          <FacultyAccountForm
            departments={departmentOptions}
            genders={enumOptions?.gender ?? []}
            civilStatuses={enumOptions?.civilStatus ?? []}
            rolePermissions={rolePermissions}
            onSubmit={handleCreate}
            onCancel={closeCreate}
          />
        )}
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Faculty">
        {editTarget && (
          <FacultyEditForm member={editTarget} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} />
        )}
      </Modal>

      <DeactivateFacultyDialog
        member={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />

      <ActivateFacultyDialog
        member={reactivateTarget}
        onClose={() => setReactivateTarget(null)}
        onConfirm={handleReactivate}
      />
    </div>
  );
}
