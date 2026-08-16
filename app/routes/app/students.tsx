import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { useAuth } from "~/hooks/use-auth";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ResultState } from "~/components/feedback/result-state";
import { AlertTriangleIcon, SearchIcon, UserCheckIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Textarea } from "~/components/ui/textarea";
import { DeactivateConfirmInput, DeactivateReasonSelect, STUDENT_DEACTIVATE_REASONS } from "~/features/deactivate-reason-select";
import { Pagination } from "~/components/ui/pagination";
import { TableSkeleton } from "~/components/ui/skeleton";
import { TabLinks } from "~/components/ui/underline-tabs";
import { useStudentAccountFilters } from "~/features/students/student-account-filters";
import { StudentAccountTable } from "~/features/students/student-account-table";
import { StudentDetailsModal } from "~/features/students/student-details-modal";
import { PageHeader } from "~/layouts/page-header";
import { irregularClassService, type IrregularStudent } from "~/services/irregular-class.service";
import { regularClassService } from "~/services/regular-class.service";
import { studentService } from "~/services/student.service";
import { useCachedData } from "~/hooks/use-cached-data";
import { usePagination } from "~/hooks/use-pagination";
import type {
  RegularStudentRow,
  StudentAccountRow,
} from "~/types/student";

export function meta() {
  return [
    { title: "Students — GWC Class Scheduling" },
    { name: "description", content: "Manage student records, enrollments, and schedules." },
  ];
}

function StudentListEmptyState({
  searchQuery,
  variant,
}: {
  searchQuery: string;
  variant: "all" | "regular" | "irregular";
}) {
  const hasSearch = searchQuery.trim() !== "";

  if (hasSearch) {
    const searchTitle =
      variant === "regular"
        ? "No regular students found"
        : variant === "irregular"
          ? "No irregular students found"
          : "No students found";
    return (
      <EmptyState title={searchTitle}>No students match your search.</EmptyState>
    );
  }

  const emptyTitle =
    variant === "regular"
      ? "No regular students yet"
      : variant === "irregular"
        ? "No irregular students yet"
        : "No records found";

  const emptyDescription =
    variant === "regular"
      ? "No regular student records have been added yet."
      : variant === "irregular"
        ? "No irregular student records have been added yet."
        : "No student records have been added yet.";

  return <EmptyState title={emptyTitle}>{emptyDescription}</EmptyState>;
}

export default function StudentsRoute() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <StudentsPage />
    </RoleGuard>
  );
}

export function StudentsPage() {
  const location = useLocation();
  const { user } = useAuth();
  const { context: termContext } = useTermContext();
  const isAdmin = user?.role === "admin";
  const syId = termContext?.selection.syId ?? null;
  const semesterNumber = termContext?.selection.semesterNumber ?? null;

  // Admin-only account list (super-admin endpoint). Registrars use the
  // term-scoped regular/irregular lists below instead, so this stays disabled.
  const { data: studentList, error: loadError, reload: reloadAccounts } = useCachedData(
    "student-accounts",
    () => studentService.listAccounts(),
    { enabled: isAdmin },
  );

  // Shared reference data for the create/enroll forms — cached under keys reused
  // across the app so revisits and reloads skip the loading state.
  const [search, setSearch] = useState("");
  const [regularSearch, setRegularSearch] = useState("");
  const [irregularSearch, setIrregularSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const statusFilterOptions = { statusFilter, onStatusFilterChange: (v: string) => setStatusFilter(v) };
  const activeView = location.pathname.includes("students-regular")
    ? "regular"
    : location.pathname.includes("students-irregular")
      ? "irregular"
      : "all";
  const [regularStudents, setRegularStudents] = useState<RegularStudentRow[] | null>(null);
  const [regularLoadError, setRegularLoadError] = useState<string | null>(null);
  const [irregularStudents, setIrregularStudents] = useState<IrregularStudent[] | null>(null);
  const [irregularLoadError, setIrregularLoadError] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState<StudentAccountRow | null>(null);
  const [deactivateAccountTarget, setDeactivateAccountTarget] = useState<StudentAccountRow | null>(null);
  const [reactivateAccountTarget, setReactivateAccountTarget] = useState<StudentAccountRow | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivateConfirmText, setDeactivateConfirmText] = useState("");
  const [reactivateReason, setReactivateReason] = useState("");
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  // The list endpoint has no account_active field — fetched per-row (page-bounded
  // by pagination) so Deactivate/Reactivate can show only the one that applies.
  const [accountActiveById, setAccountActiveById] = useState<Record<number, boolean | undefined>>({});

  // Admin-only: bulk "Create Account" selection, scoped per tab (reset on tab change below).
  const [selectedForAccount, setSelectedForAccount] = useState<Set<number>>(new Set());
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);

  const resetKey = search;

  // Admin-only: lookup map from studentProfileId → account state (built from super-admin endpoint)
  const accountLookup = useMemo(() => {
    if (!isAdmin || !studentList) return undefined;
    return Object.fromEntries(
      studentList.map((s) => [
        s.studentProfileId,
        { hasAccount: s.hasAccount, accountActive: s.accountActive ?? null },
      ]),
    );
  }, [isAdmin, studentList]);

  // For registrar: combine regular + irregular students into a unified list for "All" view
  const allStudentsForRegistrar = useMemo(() => {
    if (isAdmin || !regularStudents || !irregularStudents) return null;
    // Map regular students to a common shape
    const regularMapped: StudentAccountRow[] = regularStudents.map((s) => ({
      studentProfileId: s.studentProfileId,
      studentId: s.studentId,
      firstName: s.firstName,
      midName: s.midName,
      lastName: s.lastName,
      studentName: s.studentName,
      gender: s.gender,
      profilePhotoUrl: s.profilePhotoUrl,
      mobile: s.mobile,
      email: s.email,
      hasAccount: false,
      academics: s.academics,
    }));
    // Map irregular students to a common shape (they use studentName instead of firstName/lastName)
    const irregularMapped: StudentAccountRow[] = irregularStudents.map((s) => ({
      studentProfileId: s.studentProfileId,
      studentId: s.studentId,
      firstName: "",
      midName: null,
      lastName: "",
      studentName: s.studentName,
      gender: s.gender,
      profilePhotoUrl: s.profilePhotoUrl,
      mobile: s.mobile,
      email: s.email,
      hasAccount: false,
      academics: s.programTaken && s.programTaken !== "—"
        ? [{ studentAcademicId: 0, yearLevel: 0, program: s.programTaken, set: null, enrolledStatus: "", studentType: "", schoolYear: null, semester: null, enrolledSubjects: [] }]
        : [],
    }));
    return [...regularMapped, ...irregularMapped];
  }, [isAdmin, regularStudents, irregularStudents]);

  // Normalize regular students to StudentAccountRow shape for the unified table
  const normalizedRegularStudents = useMemo(() => {
    if (!regularStudents) return null;
    return regularStudents.map((s) => ({
      studentProfileId: s.studentProfileId,
      studentId: s.studentId,
      firstName: s.firstName,
      midName: s.midName,
      lastName: s.lastName,
      studentName: s.studentName,
      gender: s.gender,
      profilePhotoUrl: s.profilePhotoUrl,
      mobile: s.mobile,
      email: s.email,
      hasAccount: accountLookup?.[s.studentProfileId]?.hasAccount ?? false,
      accountActive: accountLookup?.[s.studentProfileId]?.accountActive ?? null,
      academics: s.academics,
    }));
  }, [regularStudents, accountLookup]);

  // Normalize irregular students to StudentAccountRow shape for the unified table
  const normalizedIrregularStudents = useMemo(() => {
    if (!irregularStudents) return null;
    return irregularStudents.map((s) => ({
      studentProfileId: s.studentProfileId,
      studentId: s.studentId,
      firstName: "",
      midName: null,
      lastName: "",
      studentName: s.studentName,
      gender: s.gender,
      profilePhotoUrl: s.profilePhotoUrl,
      mobile: s.mobile,
      email: s.email,
      hasAccount: accountLookup?.[s.studentProfileId]?.hasAccount ?? false,
      accountActive: accountLookup?.[s.studentProfileId]?.accountActive ?? null,
      academics: s.programTaken && s.programTaken !== "—"
        ? [{ studentAcademicId: 0, yearLevel: 0, program: s.programTaken, set: null, enrolledStatus: "", studentType: "", schoolYear: null, semester: null, enrolledSubjects: [] }]
        : [],
    }));
  }, [irregularStudents, accountLookup]);

  // Program/Year Level/Set/Student Type/Enrollment State filters — one instance per tab,
  // each fed that tab's own (unfiltered-by-search) row source.
  const allTabFilters = useStudentAccountFilters(
    isAdmin ? studentList ?? [] : allStudentsForRegistrar ?? [],
    statusFilterOptions,
  );
  const regularTabFilters = useStudentAccountFilters(normalizedRegularStudents ?? [], statusFilterOptions);
  const irregularTabFilters = useStudentAccountFilters(normalizedIrregularStudents ?? [], statusFilterOptions);

  const activeTabFilters =
    activeView === "regular" ? regularTabFilters : activeView === "irregular" ? irregularTabFilters : allTabFilters;

  // Reset per-tab filters and the bulk account-creation selection whenever the tab changes —
  // filter options are tab-specific and a selection from another tab shouldn't carry over.
  useEffect(() => {
    allTabFilters.resetFilters();
    regularTabFilters.resetFilters();
    irregularTabFilters.resetFilters();
    setStatusFilter("all");
    setSelectedForAccount(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const visibleStudents = useMemo(() => {
    // For admin: use studentList from super-admin endpoint
    if (isAdmin) {
      if (!studentList) return [];
      const query = search.trim().toLowerCase();
      return allTabFilters.filtered
        .filter((s) => {
          if (
            query &&
            !(s.firstName ?? "").toLowerCase().includes(query) &&
            !(s.lastName ?? "").toLowerCase().includes(query) &&
            !(s.studentId ?? "").toLowerCase().includes(query) &&
            !(s.email ?? "").toLowerCase().includes(query)
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => (a.lastName ?? "").localeCompare(b.lastName ?? "") || (a.firstName ?? "").localeCompare(b.firstName ?? ""));
    }
    // For registrar: use combined list from regular + irregular endpoints
    if (!allStudentsForRegistrar) return [];
    const query = search.trim().toLowerCase();
    return allTabFilters.filtered
      .filter((s) => {
        const name = s.studentName ?? `${s.lastName}, ${s.firstName}`;
        if (
          query &&
          !name.toLowerCase().includes(query) &&
          !(s.studentId ?? "").toLowerCase().includes(query) &&
          !(s.email ?? "").toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const nameA = a.studentName ?? `${a.lastName}, ${a.firstName}`;
        const nameB = b.studentName ?? `${b.lastName}, ${b.firstName}`;
        return nameA.localeCompare(nameB);
      });
  }, [isAdmin, studentList, allStudentsForRegistrar, allTabFilters.filtered, search]) as StudentAccountRow[];

  const visibleRegularStudents = useMemo(() => {
    if (!normalizedRegularStudents) return [];
    const query = regularSearch.trim().toLowerCase();
    return regularTabFilters.filtered
      .filter((s) => {
        if (
          query &&
          !(s.studentName ?? "").toLowerCase().includes(query) &&
          !(s.studentId ?? "").toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (a.studentName ?? "").localeCompare(b.studentName ?? ""));
  }, [normalizedRegularStudents, regularTabFilters.filtered, regularSearch]);

  const visibleIrregularStudents = useMemo(() => {
    if (!normalizedIrregularStudents) return [];
    const query = irregularSearch.trim().toLowerCase();
    return irregularTabFilters.filtered
      .filter((s) => {
        if (
          query &&
          !(s.studentName ?? "").toLowerCase().includes(query) &&
          !(s.studentId ?? "").toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (a.studentName ?? "").localeCompare(b.studentName ?? ""));
  }, [normalizedIrregularStudents, irregularTabFilters.filtered, irregularSearch]);

  const pagination = usePagination(visibleStudents, resetKey);
  const regularPagination = usePagination(visibleRegularStudents, regularSearch);
  const irregularPagination = usePagination(visibleIrregularStudents, irregularSearch);
  // Full filtered+searched list for the active tab (not just the current page) — bulk
  // account creation needs to resolve every selected id's email, not just the visible page.
  const visibleStudentsForCurrentTab =
    activeView === "regular" ? visibleRegularStudents : activeView === "irregular" ? visibleIrregularStudents : visibleStudents;
  const pageAccountIds = pagination.pageItems
    .filter((s) => s.hasAccount)
    .map((s) => s.studentProfileId)
    .join(",");

  useEffect(() => {
    if (!pageAccountIds) return;
    const ids = pageAccountIds.split(",").map(Number);
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        studentService
          .getAccount(id)
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

  // Admin: fetch account-active status for regular students on the regular tab
  const regularAccountIds = useMemo(() => {
    if (!isAdmin || activeView !== "regular" || !accountLookup) return "";
    return regularPagination.pageItems
      .filter((s) => accountLookup[s.studentProfileId])
      .map((s) => s.studentProfileId)
      .join(",");
  }, [isAdmin, activeView, accountLookup, regularPagination.pageItems]);

  useEffect(() => {
    if (!regularAccountIds) return;
    const ids = regularAccountIds.split(",").map(Number);
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        studentService
          .getAccount(id)
          .then((detail) => [id, detail.accountActive ?? true] as const)
          .catch(() => [id, true] as const),
      ),
    ).then((results) => {
      if (cancelled) return;
      setAccountActiveById((current) => ({ ...current, ...Object.fromEntries(results) }));
    });
    return () => { cancelled = true; };
  }, [regularAccountIds]);

  // Admin: fetch account-active status for irregular students on the irregular tab
  const irregularAccountIds = useMemo(() => {
    if (!isAdmin || activeView !== "irregular" || !accountLookup) return "";
    return irregularPagination.pageItems
      .filter((s) => accountLookup[s.studentProfileId])
      .map((s) => s.studentProfileId)
      .join(",");
  }, [isAdmin, activeView, accountLookup, irregularPagination.pageItems]);

  useEffect(() => {
    if (!irregularAccountIds) return;
    const ids = irregularAccountIds.split(",").map(Number);
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        studentService
          .getAccount(id)
          .then((detail) => [id, detail.accountActive ?? true] as const)
          .catch(() => [id, true] as const),
      ),
    ).then((results) => {
      if (cancelled) return;
      setAccountActiveById((current) => ({ ...current, ...Object.fromEntries(results) }));
    });
    return () => { cancelled = true; };
  }, [irregularAccountIds]);

  function refreshStudentList() {
    void reloadAccounts();
  }

  function toggleSelectForAccount(student: StudentAccountRow, checked: boolean) {
    setSelectedForAccount((current) => {
      const next = new Set(current);
      if (checked) next.add(student.studentProfileId);
      else next.delete(student.studentProfileId);
      return next;
    });
  }

  function selectAllForAccount(checked: boolean, students: StudentAccountRow[]) {
    setSelectedForAccount((current) => {
      const next = new Set(current);
      for (const s of students) {
        if (checked) next.add(s.studentProfileId);
        else next.delete(s.studentProfileId);
      }
      return next;
    });
  }

  /** Bulk "Create Account" — each selected student's own email is used (same default the single-create form offers). */
  async function handleBulkCreateAccounts() {
    const targets = visibleStudentsForCurrentTab.filter((s) => selectedForAccount.has(s.studentProfileId));
    if (targets.length === 0) return;

    const withEmail = targets.filter((s) => s.email);
    const missingEmail = targets.filter((s) => !s.email);

    const results = await Promise.allSettled(
      withEmail.map((s) =>
        studentService
          .createAccount(s.studentProfileId, { email: s.email as string, roleName: "Student" })
          .then((message) => ({ student: s, message })),
      ),
    );

    const succeeded: { student: StudentAccountRow; message: string }[] = [];
    const failed: { student: StudentAccountRow; error: string }[] = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") succeeded.push(result.value);
      else failed.push({ student: withEmail[i], error: result.reason instanceof Error ? result.reason.message : "" });
    });

    setSelectedForAccount((current) => {
      const next = new Set(current);
      for (const { student } of succeeded) next.delete(student.studentProfileId);
      return next;
    });
    refreshStudentList();

    if (missingEmail.length === 0 && failed.length === 0) {
      toast.success(succeeded.length === 1 ? succeeded[0].message : `Created ${succeeded.length} account(s).`);
      return;
    }

    const parts: string[] = [];
    if (succeeded.length > 0) parts.push(`${succeeded.length} succeeded`);
    if (failed.length > 0) {
      parts.push(
        `${failed.length} failed: ` +
          failed.map(({ student, error }) => `${displayStudentName(student)} — ${error || "Unable to create account."}`).join("; "),
      );
    }
    if (missingEmail.length > 0) {
      parts.push(`${missingEmail.length} skipped (no email on file): ${missingEmail.map(displayStudentName).join(", ")}`);
    }
    throw new Error(parts.join(". "));
  }

  function displayStudentName(s: StudentAccountRow) {
    if (s.studentName) return s.studentName;
    const parts = [s.firstName, s.midName].filter(Boolean).join(" ");
    return parts ? `${s.lastName}, ${parts}` : s.lastName;
  }

  async function handleDeactivateAccount(student: StudentAccountRow, reason: string) {
    const message = await studentService.deactivateAccount(student.studentProfileId, reason);
    if (message) toast.success(message);
    setAccountActiveById((current) => ({ ...current, [student.studentProfileId]: false }));
  }

  async function handleReactivateAccount(student: StudentAccountRow, reason: string) {
    const message = await studentService.reactivateAccount(student.studentProfileId, reason);
    if (message) toast.success(message);
    setAccountActiveById((current) => ({ ...current, [student.studentProfileId]: true }));
  }

  // Cohort membership is term-specific. Clear cached rows whenever the global
  // academic-term selector changes so the effects below fetch the new scope.
  useEffect(() => {
    setRegularStudents(null);
    setIrregularStudents(null);
    setRegularLoadError(null);
    setIrregularLoadError(null);
  }, [semesterNumber, syId]);

  // Lazy-loaded: only fetched once the Regular Students view is opened.
  useEffect(() => {
    if (!isAdmin || activeView !== "regular" || regularStudents !== null || syId == null || semesterNumber == null) return;
    let cancelled = false;
    regularClassService
      .listStudents(syId, semesterNumber)
      .then((students) => {
        if (!cancelled) setRegularStudents(students);
      })
      .catch((err) => {
        if (cancelled) return;
        setRegularLoadError(err instanceof Error ? err.message : "Unable to load regular students.");
        setRegularStudents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeView, isAdmin, regularStudents, semesterNumber, syId]);

  // Lazy-loaded: only fetched once the Irregular Students view is opened.
  useEffect(() => {
    if (!isAdmin || activeView !== "irregular" || irregularStudents !== null || syId == null || semesterNumber == null) return;
    let cancelled = false;
    irregularClassService
      .listStudents(syId, semesterNumber)
      .then((students) => {
        if (!cancelled) setIrregularStudents(students);
      })
      .catch((err) => {
        if (cancelled) return;
        setIrregularLoadError(err instanceof Error ? err.message : "Unable to load irregular students.");
        setIrregularStudents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeView, irregularStudents, isAdmin, semesterNumber, syId]);

  // For registrar: fetch both regular and irregular on mount for the "All" view.
  useEffect(() => {
    if (isAdmin || syId == null || semesterNumber == null) return;
    let cancelled = false;
    regularClassService
      .listStudents(syId, semesterNumber)
      .then((students) => {
        if (!cancelled) setRegularStudents(students);
      })
      .catch((err) => {
        if (cancelled) return;
        setRegularLoadError(err instanceof Error ? err.message : "Unable to load regular students.");
        setRegularStudents([]);
      });
    irregularClassService
      .listStudents(syId, semesterNumber)
      .then((students) => {
        if (!cancelled) setIrregularStudents(students);
      })
      .catch((err) => {
        if (cancelled) return;
        setIrregularLoadError(err instanceof Error ? err.message : "Unable to load irregular students.");
        setIrregularStudents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, semesterNumber, syId]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title={
          activeView === "regular"
            ? "Regular Students"
            : activeView === "irregular"
              ? "Irregular Students"
              : "All Students"
        }
        actions={
          isAdmin && selectedForAccount.size > 0 ? (
            <Button type="button" block={false} onClick={() => setBulkCreateOpen(true)}>
              <UserCheckIcon />
              Create Accounts ({selectedForAccount.size})
            </Button>
          ) : undefined
        }
      />

      <TabLinks
        ariaLabel="Students"
        className="mt-6"
        tabs={[
          { to: "/students", label: "All Students", end: true },
          { to: "/students-regular", label: "Regular Students", end: true },
          { to: "/students-irregular", label: "Irregular Students", end: true },
        ]}
      />

      {activeView === "all" ? (
        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="student-search"
              type="search" placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search students"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>

          {activeTabFilters.filterBar}

          {isAdmin ? (
            // Admin view: uses super-admin endpoint with account info
            loadError && studentList === null ? (
              <ResultState tone="error" title="Unable to load">
                {loadError}
              </ResultState>
            ) : studentList === null ? (
              <TableSkeleton columns={6} rows={8} />
            ) : visibleStudents.length === 0 ? (
              <StudentListEmptyState searchQuery={search} variant="all" />
            ) : (
              <>
                <StudentAccountTable
                  students={pagination.pageItems}
                  accountActiveById={accountActiveById}
                  onView={setViewTarget}
                  onDeactivateAccount={setDeactivateAccountTarget}
                  onReactivateAccount={setReactivateAccountTarget}
                  selectedIds={selectedForAccount}
                  onToggleSelect={toggleSelectForAccount}
                  onSelectAll={selectAllForAccount}
                />
                <Pagination
                  page={pagination.page}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.setPage}
                />
              </>
            )
          ) : (
            // Registrar view: combined regular + irregular
            (regularStudents === null || irregularStudents === null) ? (
              <TableSkeleton columns={6} rows={8} />
            ) : (regularLoadError || irregularLoadError) ? (
              <ResultState tone="error" title="Unable to load">
                {regularLoadError || irregularLoadError}
              </ResultState>
            ) : visibleStudents.length === 0 ? (
              <StudentListEmptyState searchQuery={search} variant="all" />
            ) : (
              <>
                <StudentAccountTable
                  students={pagination.pageItems.map((s) => ({
                    studentProfileId: s.studentProfileId,
                    studentId: s.studentId,
                    firstName: s.firstName,
                    midName: s.midName,
                    lastName: s.lastName,
                    studentName: s.studentName,
                    mobile: s.mobile,
                    email: s.email,
                    hasAccount: s.hasAccount,
                    academics: s.academics,
                  }))}
                  accountActiveById={{}}
                  onView={setViewTarget}
                  onDeactivateAccount={null}
                  onReactivateAccount={null}
                />
                <Pagination
                  page={pagination.page}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.setPage}
                />
              </>
            )
          )}
        </div>
      ) : activeView === "regular" ? (
        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="regular-student-search"
              type="search" placeholder="Search..."
              value={regularSearch}
              onChange={(e) => setRegularSearch(e.target.value)}
              aria-label="Search regular students"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>

          {activeTabFilters.filterBar}

          {regularLoadError ? (
            <ResultState tone="error" title="Unable to load">
              {regularLoadError}
            </ResultState>
          ) : regularStudents === null ? (
            <TableSkeleton columns={6} rows={8} />
          ) : visibleRegularStudents.length === 0 ? (
            <StudentListEmptyState searchQuery={regularSearch} variant="regular" />
          ) : (
            <>
              <StudentAccountTable
                students={regularPagination.pageItems}
                accountActiveById={accountActiveById}
                onView={setViewTarget}
                onDeactivateAccount={isAdmin ? setDeactivateAccountTarget : null}
                onReactivateAccount={isAdmin ? setReactivateAccountTarget : null}
                selectedIds={isAdmin ? selectedForAccount : undefined}
                onToggleSelect={isAdmin ? toggleSelectForAccount : undefined}
                onSelectAll={isAdmin ? selectAllForAccount : undefined}
              />
              <Pagination
                page={regularPagination.page}
                totalItems={regularPagination.totalItems}
                pageSize={regularPagination.pageSize}
                onPageChange={regularPagination.setPage}
              />
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="irregular-student-search"
              type="search" placeholder="Search..."
              value={irregularSearch}
              onChange={(e) => setIrregularSearch(e.target.value)}
              aria-label="Search irregular students"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>

          {activeTabFilters.filterBar}

          {irregularLoadError ? (
            <ResultState tone="error" title="Unable to load">
              {irregularLoadError}
            </ResultState>
          ) : irregularStudents === null ? (
            <TableSkeleton columns={6} rows={8} />
          ) : visibleIrregularStudents.length === 0 ? (
            <StudentListEmptyState searchQuery={irregularSearch} variant="irregular" />
          ) : (
            <>
              <StudentAccountTable
                students={irregularPagination.pageItems}
                accountActiveById={accountActiveById}
                onView={setViewTarget}
                onDeactivateAccount={isAdmin ? setDeactivateAccountTarget : null}
                onReactivateAccount={isAdmin ? setReactivateAccountTarget : null}
                selectedIds={isAdmin ? selectedForAccount : undefined}
                onToggleSelect={isAdmin ? toggleSelectForAccount : undefined}
                onSelectAll={isAdmin ? selectAllForAccount : undefined}
              />
              <Pagination
                page={irregularPagination.page}
                totalItems={irregularPagination.totalItems}
                pageSize={irregularPagination.pageSize}
                onPageChange={irregularPagination.setPage}
              />
            </>
          )}
        </div>
      )}

      <Modal
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        title="Student Details"
        wide
      >
        {viewTarget && (
          <StudentDetailsModal
            student={viewTarget}
          />
        )}
      </Modal>

      {isAdmin && (
        <>
          <Modal
            open={deactivateAccountTarget !== null}
            onClose={() => { setDeactivateAccountTarget(null); setDeactivateReason(""); setDeactivateConfirmText(""); }}
            title="Deactivate account"
          >
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertDescription>
                <span className="font-semibold">
                  {deactivateAccountTarget?.studentName || `${deactivateAccountTarget?.firstName} ${deactivateAccountTarget?.lastName}`}
                </span>{" "}
                will no longer be able to log in. The student record is preserved and the account can be reactivated later.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <DeactivateReasonSelect
                id="deactivate-student"
                reason={deactivateReason}
                onReasonChange={setDeactivateReason}
                presetReasons={STUDENT_DEACTIVATE_REASONS}
              />
            </div>
            <div className="mt-4">
              <DeactivateConfirmInput id="deactivate-student-confirm" value={deactivateConfirmText} onChange={setDeactivateConfirmText} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" block={false} onClick={() => { setDeactivateAccountTarget(null); setDeactivateReason(""); setDeactivateConfirmText(""); }}>
                Cancel
              </Button>
              <Button
                type="button"
                block={false}
                variant="danger"
                onClick={async () => {
                  if (!deactivateAccountTarget) return;
                  setAccountActionLoading(true);
                  try {
                    await handleDeactivateAccount(deactivateAccountTarget, deactivateReason);
                    setDeactivateReason("");
                    setDeactivateConfirmText("");
                    setDeactivateAccountTarget(null);
                  } finally {
                    setAccountActionLoading(false);
                  }
                }}
                disabled={deactivateConfirmText !== "DEACTIVATE" || !deactivateReason.trim()}
                isLoading={accountActionLoading}
                loadingLabel="Deactivating…"
              >
                Deactivate
              </Button>
            </div>
          </Modal>

          <Modal
            open={reactivateAccountTarget !== null}
            onClose={() => { setReactivateAccountTarget(null); setReactivateReason(""); }}
            title="Reactivate account"
          >
            <p className="font-body text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-navy-800 dark:text-mist-100">
                {reactivateAccountTarget?.studentName || `${reactivateAccountTarget?.firstName} ${reactivateAccountTarget?.lastName}`}
              </span>{" "}
              will be able to log in again.
            </p>
            <div className="mt-4">
            <Textarea
              id="reactivate-student-reason"
              label="Reason"
              value={reactivateReason}
              onChange={(e) => setReactivateReason(e.target.value)}
            />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" block={false} onClick={() => { setReactivateAccountTarget(null); setReactivateReason(""); }}>
                Cancel
              </Button>
              <Button
                type="button"
                block={false}
                variant="primary"
                onClick={async () => {
                  if (!reactivateAccountTarget) return;
                  setAccountActionLoading(true);
                  try {
                    await handleReactivateAccount(reactivateAccountTarget, reactivateReason);
                    setReactivateReason("");
                    setReactivateAccountTarget(null);
                  } finally {
                    setAccountActionLoading(false);
                  }
                }}
                disabled={!reactivateReason.trim()}
                isLoading={accountActionLoading}
                loadingLabel="Reactivating…"
              >
                Reactivate
              </Button>
            </div>
          </Modal>

          <ConfirmDialog
            open={bulkCreateOpen}
            onClose={() => setBulkCreateOpen(false)}
            title="Create student accounts"
            confirmLabel={`Create ${selectedForAccount.size} account(s)`}
            loadingLabel="Creating…"
            onConfirm={handleBulkCreateAccounts}
          >
            {selectedForAccount.size} student(s) will each get a login account using the email already on their
            profile, with a temporary password emailed to them.
          </ConfirmDialog>
        </>
      )}

    </div>
  );
}
