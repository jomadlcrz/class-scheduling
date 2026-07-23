import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { SuccessDone } from "~/components/feedback/success-done";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { StudentAccountForm } from "~/features/students/student-account-form";
import { StudentAccountTable } from "~/features/students/student-account-table";
import { StudentDetailsModal } from "~/features/students/student-details-modal";
import { StudentEnrollForm } from "~/features/students/student-enroll-form";
import { StudentRecordForm } from "~/features/students/student-record-form";
import { RegularStudentTable } from "~/features/students/regular-student-table";
import { IrregularStudentTable } from "~/features/students/irregular-student-table";
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
  CreateStudentAccountInput,
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

export default function StudentsRoute() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <StudentsPage />
    </RoleGuard>
  );
}

export function StudentsPage() {
  const location = useLocation();
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
  const [accountTarget, setAccountTarget] = useState<StudentAccountRow | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<StudentAccountRow | null>(null);
  const [enrollTarget, setEnrollTarget] = useState<StudentAccountRow | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [deactivateAccountTarget, setDeactivateAccountTarget] = useState<StudentAccountRow | null>(null);
  const [reactivateAccountTarget, setReactivateAccountTarget] = useState<StudentAccountRow | null>(null);
  // The list endpoint has no account_active field — fetched per-row (page-bounded
  // by pagination) so Deactivate/Reactivate can show only the one that applies.
  const [accountActiveById, setAccountActiveById] = useState<Record<number, boolean | undefined>>({});

  useEffect(() => {
    studentService
      .listAccounts()
      .then(setStudentList)
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load students.");
        setStudentList([]);
      });
    // Dropdown data for the new-student form; failures just leave the
    // dropdowns empty (validation reports the missing selection).
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    setService.list().then(setSets).catch(() => setSets([]));
    subjectService.list().then(setSubjects).catch(() => setSubjects([]));
    schoolYearService.list().then(setSchoolYears).catch(() => setSchoolYears([]));
    semesterService.list().then(setSemesters).catch(() => setSemesters([]));
    enumService.getOptions().then(setEnumOptions).catch(() => setEnumOptions(null));
  }, []);

  const resetKey = search;

  const visibleStudents = useMemo(() => {
    if (!studentList) return [];
    const query = search.trim().toLowerCase();
    return studentList
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
  }, [studentList, search]);

  const visibleRegularStudents = useMemo(() => {
    if (!regularStudents) return [];
    const query = regularSearch.trim().toLowerCase();
    return regularStudents
      .filter((s) => {
        if (
          query &&
          !(s.firstName ?? "").toLowerCase().includes(query) &&
          !(s.lastName ?? "").toLowerCase().includes(query) &&
          !(s.studentId ?? "").toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (a.lastName ?? "").localeCompare(b.lastName ?? "") || (a.firstName ?? "").localeCompare(b.firstName ?? ""));
  }, [regularStudents, regularSearch]);

  const visibleIrregularStudents = useMemo(() => {
    if (!irregularStudents) return [];
    const query = irregularSearch.trim().toLowerCase();
    return irregularStudents
      .filter((s) => {
        if (
          query &&
          !s.studentName.toLowerCase().includes(query) &&
          !(s.studentId ?? "").toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [irregularStudents, irregularSearch]);

  const pagination = usePagination(visibleStudents, resetKey);
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

  function refreshStudentList() {
    studentService.listAccounts().then(setStudentList).catch(() => {});
  }

  async function handleCreateRecord(input: CreateStudentRecordInput) {
    const message = await studentService.createRecord(input);
    if (message) toast.success(message);
    setCreatedRecord(true);
    refreshStudentList();
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreatedRecord(false);
  }

  async function handleCreateAccount(input: CreateStudentAccountInput) {
    if (!accountTarget) return;
    const message = await studentService.createAccount(accountTarget.studentProfileId, input);
    if (message) toast.success(message);
    setCreatedEmail(input.email);
    // Refresh the list so the account status updates.
    studentService.listAccounts().then(setStudentList).catch(() => {});
  }

  function closeAccountModal() {
    setAccountTarget(null);
    setCreatedEmail(null);
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

  // Lazy-loaded: only fetched once the Regular Students view is opened.
  useEffect(() => {
    if (activeView !== "regular" || regularStudents !== null) return;
    regularClassService
      .listStudents()
      .then(setRegularStudents)
      .catch((err) => {
        setRegularLoadError(err instanceof Error ? err.message : "Unable to load regular students.");
        setRegularStudents([]);
      });
  }, [activeView, regularStudents]);

  // Lazy-loaded: only fetched once the Irregular Students view is opened.
  useEffect(() => {
    if (activeView !== "irregular" || irregularStudents !== null) return;
    irregularClassService
      .listStudents()
      .then(setIrregularStudents)
      .catch((err) => {
        setIrregularLoadError(err instanceof Error ? err.message : "Unable to load irregular students.");
        setIrregularStudents([]);
      });
  }, [activeView, irregularStudents]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Students"
        description="Student records and their login accounts."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Student
          </Button>
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
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative ml-auto w-full sm:w-64">
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
          </div>

          {loadError ? (
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
            <EmptyState title="No students found">
              No students match the current filters.
            </EmptyState>
          ) : (
            <>
              <StudentAccountTable
                students={pagination.pageItems}
                accountActiveById={accountActiveById}
                onCreateAccount={setAccountTarget}
                onView={setViewTarget}
                onEnroll={setEnrollTarget}
                onDeactivateAccount={setDeactivateAccountTarget}
                onReactivateAccount={setReactivateAccountTarget}
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
      ) : activeView === "regular" ? (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative ml-auto w-full sm:w-64">
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
          </div>

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
            <EmptyState title="No regular students">
              No students match the current filters.
            </EmptyState>
          ) : (
            <RegularStudentTable students={visibleRegularStudents} />
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
            <EmptyState title="No irregular students">
              No students match the current filters.
            </EmptyState>
          ) : (
            <IrregularStudentTable students={visibleIrregularStudents} />
          )}
        </div>
      )}

      <Modal open={createOpen} onClose={closeCreate} title="New Student" wide={!createdRecord}>
        {createdRecord ? (
          <SuccessDone title="Student registered" onDone={closeCreate}>
            The student record was created. Use “Create Account” on the student’s row to set
            up their login.
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
        open={accountTarget !== null}
        onClose={closeAccountModal}
        title="Create Student Account"
      >
        {createdEmail ? (
          <SuccessDone title="Account created" onDone={closeAccountModal}>
            Login credentials with a temporary password were emailed to {createdEmail}.
          </SuccessDone>
        ) : (
          accountTarget && (
            <StudentAccountForm
              student={accountTarget}
              onSubmit={handleCreateAccount}
              onCancel={closeAccountModal}
            />
          )
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
          {deactivateAccountTarget?.firstName} {deactivateAccountTarget?.lastName}
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
          {reactivateAccountTarget?.firstName} {reactivateAccountTarget?.lastName}
        </span>{" "}
        will be able to log in again.
      </ConfirmDialog>
    </div>
  );
}
