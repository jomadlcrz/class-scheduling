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
import { ActivateFacultyDialog } from "~/features/faculty/activate-faculty-dialog";
import { DeactivateFacultyDialog } from "~/features/faculty/deactivate-faculty-dialog";
import { DepartmentFilterSelect } from "~/features/faculty/department-filter-select";
import { FacultyEditForm } from "~/features/faculty/faculty-edit-form";
import { FacultyTable } from "~/features/faculty/faculty-table";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { useCachedData } from "~/hooks/use-cached-data";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { facultyService } from "~/services/faculty.service";
import type { Faculty } from "~/types/faculty";

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
  const navigate = useNavigate();
  const { data: facultyList, error: loadError, reload: refreshFacultyList } = useCachedData(
    "faculty",
    () => facultyService.list(),
  );

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  const [editTarget, setEditTarget] = useState<Faculty | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Faculty | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<Faculty | null>(null);
  // The list endpoint has no account status — fetched per-row (page-bounded
  // by pagination) from GET /super-admin/faculty-accounts/<id>, which returns
  // accountActive true/false for a login and null when the profile has none.
  const [accountActiveById, setAccountActiveById] = useState<Record<number, boolean | null | undefined>>({});

  /** Unique department codes derived from the faculty list. */
  const departmentCodes = useMemo(() => {
    if (!facultyList) return [];
    const codes = new Set(facultyList.map((f) => f.departmentCode));
    return [...codes].sort();
  }, [facultyList]);

  const resetKey = `${search}|${department}|${role}|${status}`;

  const visibleFaculty = useMemo(() => {
    if (!facultyList) return [];
    const query = search.trim().toLowerCase();
    return facultyList
      .filter((member) => {
        if (department !== "all" && member.departmentCode !== department) return false;
        if (role !== "all" && !member.roles.some((r) => r.name === role)) return false;
        if (status === "active" && !member.hasAccount) return false;
        if (status === "no_account" && member.hasAccount) return false;
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
  }, [facultyList, search, department, role, status]);

  const pagination = usePagination(visibleFaculty, resetKey);
  const pageAccountIds = pagination.pageItems.map((f) => f.id).join(",");

  useEffect(() => {
    if (!pageAccountIds) return;
    const ids = pageAccountIds.split(",").map(Number);
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        facultyService
          .get(id)
          .then((detail): [number, boolean | null] => [id, detail.accountActive])
          .catch((): [number, boolean | null] => [id, null]),
      ),
    ).then((results) => {
      if (cancelled) return;
      setAccountActiveById((current) => ({ ...current, ...Object.fromEntries(results) }));
    });
    return () => {
      cancelled = true;
    };
  }, [pageAccountIds]);

  async function handleEdit(input: { firstName: string; midName?: string | null; lastName: string; mobile: string; email: string }) {
    if (!editTarget) return;
    const message = await facultyService.update(editTarget.id, input);
    if (message) toast.success(message);
    setEditTarget(null);
    refreshFacultyList();
  }

  async function handleDeactivate(member: Faculty, reason: string) {
    const message = await facultyService.deactivate(member.id, reason);
    if (message) toast.success(message);
    setAccountActiveById((current) => ({ ...current, [member.id]: false }));
    setDeactivateTarget(null);
  }

  async function handleReactivate(member: Faculty, reason: string) {
    const message = await facultyService.reactivate(member.id, reason);
    if (message) toast.success(message);
    setAccountActiveById((current) => ({ ...current, [member.id]: true }));
    setReactivateTarget(null);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Instructors & Deans"

        actions={
          <Button type="button" block={false} onClick={() => navigate("/faculty/new")}>
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
          <FilterDropdown
            id="faculty-role-filter"
            label="Role"
            allLabel="All"
            options={[
              { value: "Dean", label: "Dean" },
              { value: "Instructor", label: "Instructor" },
            ]}
            value={role}
            onChange={setRole}
          />
          <FilterDropdown
            id="faculty-status-filter"
            label="Status"
            allLabel="All"
            options={[
              { value: "active", label: "Active" },
              { value: "no_account", label: "No account" },
            ]}
            value={status}
            onChange={setStatus}
          />
          <div className="relative order-first w-full sm:order-0 sm:ml-auto sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="faculty-search"
              type="search" placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>
        </div>

        {loadError && facultyList === null ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : facultyList === null ? (
          <TableSkeleton columns={6} rows={8} />
        ) : visibleFaculty.length === 0 ? (
          <EmptyState title={search.trim() || department !== "all" || role !== "all" || status !== "all" ? "No faculty found" : "No faculty yet"}>
            {search.trim() || department !== "all" || role !== "all" || status !== "all"
              ? "No faculty match the current search and filters."
              : "Add a faculty member to get started."}
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
