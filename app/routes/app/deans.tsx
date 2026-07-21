import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { SuccessDone } from "~/components/feedback/success-done";
import { PlusIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { DeanForm } from "~/features/deans/dean-form";
import { DeanTable } from "~/features/deans/dean-table";
import { DepartmentFilterSelect } from "~/features/faculty/department-filter-select";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { deanService } from "~/services/dean.service";
import { enumService, type EnumOptions } from "~/services/enum.service";
import { facultyService } from "~/services/faculty.service";
import type { DepartmentOption } from "~/types/department";
import type { CreateFacultyAccountInput, Faculty } from "~/types/faculty";

export function meta() {
  return [
    { title: "Deans — GWC Class Scheduling" },
    { name: "description", content: "Manage dean assignments and department oversight." },
  ];
}

export default function DeansRoute() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <DeansPage />
    </RoleGuard>
  );
}

function DeansPage() {
  const [deanList, setDeanList] = useState<Faculty[] | null>(null);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [enumOptions, setEnumOptions] = useState<EnumOptions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  useEffect(() => {
    deanService
      .list()
      .then(setDeanList)
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load deans.");
        setDeanList([]);
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
  }, []);

  /** Unique department codes derived from the dean list. */
  const departmentCodes = useMemo(() => {
    if (!deanList) return [];
    const codes = new Set(deanList.map((d) => d.departmentCode));
    return [...codes].sort();
  }, [deanList]);

  const resetKey = `${search}|${department}`;

  const visibleDeans = useMemo(() => {
    if (!deanList) return [];
    const query = search.trim().toLowerCase();
    return deanList
      .filter((member) => {
        if (department !== "all" && member.departmentCode !== department) return false;
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
  }, [deanList, search, department]);

  const pagination = usePagination(visibleDeans, resetKey);

  // No PATCH endpoint exists yet for faculty/dean accounts, so there's no
  // Edit action here — only create + list, matching what the backend supports.
  async function handleCreate(input: Omit<CreateFacultyAccountInput, "roleName">) {
    const message = await deanService.create(input);
    if (message) toast.success(message);
    setCreatedEmail(input.email);
    // Refresh the list so the new dean appears.
    deanService.list().then(setDeanList).catch(() => {});
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreatedEmail(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Deans"
        description="Dean assignments and department oversight."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Dean
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <Input
            id="dean-search"
            label="Search"
            type="search"
            placeholder="Name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <DepartmentFilterSelect
            id="dean-dept-filter"
            departmentCodes={departmentCodes}
            value={department}
            onValueChange={setDepartment}
          />
        </div>

        {loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : deanList === null ? (
          <div
            role="status"
            aria-label="Loading deans"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleDeans.length === 0 ? (
          <EmptyState title="No deans found">
            No deans match the current filters. Adjust the search or add a new dean.
          </EmptyState>
        ) : (
          <>
            <DeanTable deans={pagination.pageItems} />
            <Pagination
              page={pagination.page}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
            />
          </>
        )}
      </div>

      <Modal open={createOpen} onClose={closeCreate} title="New Dean">
        {createdEmail ? (
          <SuccessDone title="Dean registered" onDone={closeCreate}>
            Login credentials with a temporary password were emailed to {createdEmail}.
          </SuccessDone>
        ) : (
          <DeanForm
            departments={departmentOptions}
            genders={enumOptions?.gender ?? []}
            civilStatuses={enumOptions?.civilStatus ?? []}
            onSubmit={handleCreate}
            onCancel={closeCreate}
          />
        )}
      </Modal>
    </div>
  );
}
