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
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { FacultyAccountForm } from "~/features/faculty/faculty-account-form";
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

  async function handleCreate(input: CreateFacultyAccountInput) {
    const message = await facultyService.create(input);
    if (message) toast.success(message);
    setCreatedEmail(input.email);
    // Refresh the list so the new faculty member appears.
    facultyService.list().then(setFacultyList).catch(() => {});
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreatedEmail(null);
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <Input
            id="faculty-search"
            label="Search"
            type="search"
            placeholder="Name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            id="faculty-dept-filter"
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="all">All departments</option>
            {departmentCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
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
            <FacultyTable faculty={pagination.pageItems} />
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
          <div className="flex flex-col items-center gap-4">
            <ResultState tone="success" title="Faculty registered">
              Login credentials with a temporary password were emailed to {createdEmail}.
            </ResultState>
            <Button type="button" block={false} onClick={closeCreate}>
              <span className="px-4">Done</span>
            </Button>
          </div>
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
    </div>
  );
}
