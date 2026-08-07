import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { useAuth } from "~/hooks/use-auth";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { SuccessDone } from "~/components/feedback/success-done";
import { PlusIcon, SearchIcon, UserCheckIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { useStudentAccountFilters } from "~/features/students/student-account-filters";
import { StudentAccountTable } from "~/features/students/student-account-table";
import { StudentArchiveDialog } from "~/features/students/student-archive-dialog";
import { StudentDetailsModal } from "~/features/students/student-details-modal";
import { StudentEnrollForm } from "~/features/students/student-enroll-form";
import { StudentRecordForm } from "~/features/students/student-record-form";
import { PageHeader } from "~/layouts/page-header";
import { enumService, type EnumOptions } from "~/services/enum.service";
import { irregularClassService, type IrregularStudent } from "~/services/irregular-class.service";
import { programService } from "~/services/program.service";
import { regularClassService } from "~/services/regular-class.service";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import { setService } from "~/services/set.service";
import { studentService } from "~/services/student.service";
import { subjectService } from "~/services/subject.service";
import { usePagination } from "~/hooks/use-pagination";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";
import type {
  CreateStudentRecordInput,
  EnrollStudentInput,
  RegularStudentRow,
  StudentAccountRow,
} from "~/types/student";
import type { Subject } from "~/types/subject";

export function meta() {
  return [
    { title: "Students — GWC Class Scheduling" },
    { name: "description", content: "Manage student records and their login accounts." },
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { context: termContext } = useTermContext();
  const isAdmin = user?.role === "admin";
  const syId = termContext?.selection.syId ?? null;
  const semesterNumber = termContext?.selection.semesterNumber ?? null;

  const [studentList, setStudentList] = useState<StudentAccountRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [sets, setSets] = useState<ClassSet[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [enumOptions, setEnumOptions] = useState<EnumOptions | null>(null);

  const [search, setSearch] = useState("");
  const [regularSearch, setRegularSearch] = useState("");
  const [irregularSearch, setIrregularSearch] = useState("");
  const activeView = location.pathname.includes("students-regular")
    ? "regular"
    : location.pathname.includes("students-irregular")
      ? "irregular"
      : "all";
  const [regularStudents, setRegularStudents] = useState<RegularStudentRow[] | null>(null);
  const [regularLoadError, setRegularLoadError] = useState<string | null>(null);
  const [irregularStudents, setIrregularStudents] = useState<IrregularStudent[] | null>(null);
  const [irregularLoadError, setIrregularLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createdRecord, setCreatedRecord] = useState(false);
  const [viewTarget, setViewTarget] = useState<StudentAccountRow | null>(null);
  const [enrollTarget, setEnrollTarget] = useState<StudentAccountRow | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [deactivateAccountTarget, setDeactivateAccountTarget] = useState<StudentAccountRow | null>(null);
  const [reactivateAccountTarget, setReactivateAccountTarget] = useState<StudentAccountRow | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<StudentAccountRow | null>(null);
  // The list endpoint has no account_active field — fetched per-row (page-bounded
  // by pagination) so Deactivate/Reactivate can show only the one that applies.
  const [accountActiveById, setAccountActiveById] = useState<Record<number, boolean | undefined>>({});

  // Admin-only: bulk "Create Account" selection, scoped per tab (reset on tab change below).
  const [selectedForAccount, setSelectedForAccount] = useState<Set<number>>(new Set());
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);

  // Load student lists based on role
  useEffect(() => {
    if (isAdmin) {
      // Admin: use super-admin endpoint with account info
      studentService
        .listAccounts()
        .then(setStudentList)
        .catch((err) => {
          setLoadError(err instanceof Error ? err.message : "Unable to load students.");
          setStudentList([]);
        });
    }
    // Dropdown data for the new-student form; failures just leave the
    // dropdowns empty (validation reports the missing selection).
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    setService.list().then(setSets).catch(() => setSets([]));
    subjectService.list().then(setSubjects).catch(() => setSubjects([]));
    schoolYearService.list().then(setSchoolYears).catch(() => setSchoolYears([]));
    semesterService.list().then(setSemesters).catch(() => setSemesters([]));
    enumService.getOptions().then(setEnumOptions).catch(() => setEnumOptions(null));
  }, [isAdmin]);

  const resetKey = search;

  // Admin-only: lookup map from studentProfileId → hasAccount (built from super-admin endpoint)
  const accountLookup = useMemo(() => {
    if (!isAdmin || !studentList) return undefined;
    return Object.fromEntries(studentList.map((s) => [s.studentProfileId, s.hasAccount]));
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
      mobile: s.mobile,
      email: s.email,
      hasAccount: accountLookup?.[s.studentProfileId] ?? false,
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
      mobile: s.mobile,
      email: s.email,
      hasAccount: accountLookup?.[s.studentProfileId] ?? false,
      academics: s.programTaken && s.programTaken !== "—"
        ? [{ studentAcademicId: 0, yearLevel: 0, program: s.programTaken, set: null, enrolledStatus: "", studentType: "", schoolYear: null, semester: null, enrolledSubjects: [] }]
        : [],
    }));
  }, [irregularStudents, accountLookup]);

  // Program/Year Level/Set/Student Type/Enrollment State filters — one instance per tab,
  // each fed that tab's own (unfiltered-by-search) row source.
  const allTabFilters = useStudentAccountFilters(isAdmin ? studentList ?? [] : allStudentsForRegistrar ?? []);
  const regularTabFilters = useStudentAccountFilters(normalizedRegularStudents ?? []);
  const irregularTabFilters = useStudentAccountFilters(normalizedIrregularStudents ?? []);

  const activeTabFilters =
    activeView === "regular" ? regularTabFilters : activeView === "irregular" ? irregularTabFilters : allTabFilters;

  // Reset per-tab filters and the bulk account-creation selection whenever the tab changes —
  // filter options are tab-specific and a selection from another tab shouldn't carry over.
  useEffect(() => {
    allTabFilters.resetFilters();
    regularTabFilters.resetFilters();
    irregularTabFilters.resetFilters();
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
    studentService.listAccounts().then(setStudentList).catch(() => {});
  }

  async function handleCreateRecord(input: CreateStudentRecordInput) {
    const { message } = await studentService.createRecord(input);
    if (message) toast.success(message);
    setCreatedRecord(true);
    refreshStudentList();
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreatedRecord(false);
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

  async function handleEnroll(input: EnrollStudentInput) {
    if (!enrollTarget) return;
    const message = await studentService.enroll(enrollTarget.studentProfileId, input);
    if (message) toast.success(message);
    setEnrolled(true);
    studentService.listAccounts().then(setStudentList).catch(() => {});
  }

  function closeEnrollModal() {
    setEnrollTarget(null);
    setEnrolled(false);
  }

  async function handleDeactivateAccount(student: StudentAccountRow) {
    const message = await studentService.deactivateAccount(student.studentProfileId);
    if (message) toast.success(message);
    setAccountActiveById((current) => ({ ...current, [student.studentProfileId]: false }));
  }

  async function handleReactivateAccount(student: StudentAccountRow) {
    const message = await studentService.reactivateAccount(student.studentProfileId);
    if (message) toast.success(message);
    setAccountActiveById((current) => ({ ...current, [student.studentProfileId]: true }));
  }

  async function reloadStudentLists() {
    if (isAdmin) {
      studentService.listAccounts().then(setStudentList).catch(() => setStudentList([]));
    } else {
      if (syId == null || semesterNumber == null) return;
      regularClassService.listStudents(syId, semesterNumber).then(setRegularStudents).catch(() => setRegularStudents([]));
      irregularClassService.listStudents(syId, semesterNumber).then(setIrregularStudents).catch(() => setIrregularStudents([]));
    }
  }

  async function handleArchiveProfile(_student: StudentAccountRow) {
    await reloadStudentLists();
    setArchiveTarget(null);
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Students"
        description="Student records and their login accounts."
        actions={
          !isAdmin ? (
            <Button
              type="button"
              block={false}
              onClick={() =>
                navigate(activeView === "irregular" ? "/students-irregular/bulk" : "/students-regular/bulk")
              }
            >
              <PlusIcon />
              New Student
            </Button>
          ) : selectedForAccount.size > 0 ? (
            <Button type="button" block={false} onClick={() => setBulkCreateOpen(true)}>
              <UserCheckIcon />
              Create Accounts ({selectedForAccount.size})
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 flex gap-2 border-b border-slate-200 dark:border-white/10">
        {[
          { to: "/students", label: "All Students" },
          { to: "/students-regular", label: "Regular Students" },
          { to: "/students-irregular", label: "Irregular Students" },
        ].map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              `-mb-px border-b-2 px-4 py-2 font-body text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "border-navy-800 text-navy-800 dark:border-white dark:text-mist-100"
                  : "border-transparent text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      {activeView === "all" ? (
        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="student-search"
              type="search"
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search students"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>

          {activeTabFilters.filterBar}

          {isAdmin ? (
            // Admin view: uses super-admin endpoint with account info
            loadError ? (
              <ResultState tone="error" title="Unable to load">
                {loadError}
              </ResultState>
            ) : studentList === null ? (
              <div
                role="status"
                aria-label="Loading students"
                className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
              >
                <Spinner />
              </div>
            ) : visibleStudents.length === 0 ? (
              <StudentListEmptyState searchQuery={search} variant="all" />
            ) : (
              <>
                <StudentAccountTable
                  students={pagination.pageItems}
                  accountActiveById={accountActiveById}
                  onView={setViewTarget}
                  onEnroll={null}
                  onDeactivateAccount={setDeactivateAccountTarget}
                  onReactivateAccount={setReactivateAccountTarget}
                  onArchiveProfile={setArchiveTarget}
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
              <div
                role="status"
                aria-label="Loading students"
                className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
              >
                <Spinner />
              </div>
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
                  onEnroll={setEnrollTarget}
                  onDeactivateAccount={null}
                  onReactivateAccount={null}
                  onArchiveProfile={setArchiveTarget}
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
              type="search"
              placeholder="Search by name or ID…"
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
            <div
              role="status"
              aria-label="Loading regular students"
              className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
            >
              <Spinner />
            </div>
          ) : visibleRegularStudents.length === 0 ? (
            <StudentListEmptyState searchQuery={regularSearch} variant="regular" />
          ) : (
            <>
              <StudentAccountTable
                students={regularPagination.pageItems}
                accountActiveById={accountActiveById}
                onView={setViewTarget}
                onEnroll={isAdmin ? null : setEnrollTarget}
                onDeactivateAccount={isAdmin ? setDeactivateAccountTarget : null}
                onReactivateAccount={isAdmin ? setReactivateAccountTarget : null}
                onArchiveProfile={setArchiveTarget}
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
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative ml-auto w-full sm:w-64">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <SearchIcon />
              </span>
              <input
                id="irregular-student-search"
                type="search"
                placeholder="Search by name or ID…"
                value={irregularSearch}
                onChange={(e) => setIrregularSearch(e.target.value)}
                aria-label="Search irregular students"
                className={`${inputClassName} pl-9 pr-4`}
              />
            </div>
          </div>

          {activeTabFilters.filterBar}

          {irregularLoadError ? (
            <ResultState tone="error" title="Unable to load">
              {irregularLoadError}
            </ResultState>
          ) : irregularStudents === null ? (
            <div
              role="status"
              aria-label="Loading irregular students"
              className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
            >
              <Spinner />
            </div>
          ) : visibleIrregularStudents.length === 0 ? (
            <StudentListEmptyState searchQuery={irregularSearch} variant="irregular" />
          ) : (
            <>
              <StudentAccountTable
                students={irregularPagination.pageItems}
                accountActiveById={accountActiveById}
                onView={setViewTarget}
                onEnroll={isAdmin ? null : setEnrollTarget}
                onDeactivateAccount={isAdmin ? setDeactivateAccountTarget : null}
                onReactivateAccount={isAdmin ? setReactivateAccountTarget : null}
                onArchiveProfile={setArchiveTarget}
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

      <Modal open={createOpen} onClose={closeCreate} title="New Student" wide={!createdRecord}>
        {createdRecord ? (
          <SuccessDone title="Student registered" onDone={closeCreate}>
            {isAdmin
              ? 'The student record was created. Use "Create Account" on the student\'s row to set up their login.'
              : "The student record was created."}
          </SuccessDone>
        ) : (
          <StudentRecordForm
            programs={programs}
            sets={sets}
            subjects={subjects}
            schoolYears={schoolYears}
            semesters={semesters}
            studentTypes={enumOptions?.studentType ?? []}
            academicStatuses={enumOptions?.academicStatus ?? []}
            onSubmit={handleCreateRecord}
            onCancel={closeCreate}
          />
        )}
      </Modal>

      <Modal
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        title="Student Details"
        wide
      >
        {viewTarget && (
          <StudentDetailsModal
            student={viewTarget}
            sets={sets}
            academicStatuses={enumOptions?.academicStatus ?? []}
            enrollmentStates={enumOptions?.enrollmentState ?? []}
          />
        )}
      </Modal>

      <Modal open={enrollTarget !== null} onClose={closeEnrollModal} title="Enroll Student" wide={!enrolled}>
        {enrolled ? (
          <SuccessDone title="Student enrolled" onDone={closeEnrollModal}>
            The student was enrolled for the selected term.
          </SuccessDone>
        ) : (
          enrollTarget && (
            <StudentEnrollForm
              student={enrollTarget}
              programs={programs}
              sets={sets}
              subjects={subjects}
              schoolYears={schoolYears}
              semesters={semesters}
              studentTypes={enumOptions?.studentType ?? []}
              academicStatuses={enumOptions?.academicStatus ?? []}
              onSubmit={handleEnroll}
              onCancel={closeEnrollModal}
            />
          )
        )}
      </Modal>

      {isAdmin && (
        <>
          <ConfirmDialog
            open={deactivateAccountTarget !== null}
            onClose={() => setDeactivateAccountTarget(null)}
            title="Deactivate account"
            confirmLabel="Deactivate"
            loadingLabel="Deactivating…"
            confirmVariant="danger"
            onConfirm={() => handleDeactivateAccount(deactivateAccountTarget!)}
          >
            <span className="font-medium text-navy-700 dark:text-mist-100">
              {deactivateAccountTarget?.studentName || `${deactivateAccountTarget?.firstName} ${deactivateAccountTarget?.lastName}`}
            </span>{" "}
            will no longer be able to log in. Their student record is kept.
          </ConfirmDialog>

          <ConfirmDialog
            open={reactivateAccountTarget !== null}
            onClose={() => setReactivateAccountTarget(null)}
            title="Reactivate account"
            confirmLabel="Reactivate"
            loadingLabel="Reactivating…"
            onConfirm={() => handleReactivateAccount(reactivateAccountTarget!)}
          >
            <span className="font-medium text-navy-700 dark:text-mist-100">
              {reactivateAccountTarget?.studentName || `${reactivateAccountTarget?.firstName} ${reactivateAccountTarget?.lastName}`}
            </span>{" "}
            will be able to log in again.
          </ConfirmDialog>

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

      <StudentArchiveDialog
        student={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveProfile}
      />

    </div>
  );
}
