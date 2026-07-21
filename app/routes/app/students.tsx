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
import { StudentAccountForm } from "~/features/students/student-account-form";
import { StudentAccountTable } from "~/features/students/student-account-table";
import { StudentDetailsModal } from "~/features/students/student-details-modal";
import { StudentEnrollForm } from "~/features/students/student-enroll-form";
import { StudentRecordForm } from "~/features/students/student-record-form";
import { RegularStudentTable } from "~/features/students/regular-student-table";
import { PageHeader } from "~/layouts/page-header";
import { enumService, type EnumOptions } from "~/services/enum.service";
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

function StudentsPage() {
  const [studentList, setStudentList] = useState<StudentAccountRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [sets, setSets] = useState<ClassSet[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [enumOptions, setEnumOptions] = useState<EnumOptions | null>(null);

  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<"all" | "regular">("all");
  const [regularStudents, setRegularStudents] = useState<RegularStudentRow[] | null>(null);
  const [regularLoadError, setRegularLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createdRecord, setCreatedRecord] = useState(false);
  const [accountTarget, setAccountTarget] = useState<StudentAccountRow | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<StudentAccountRow | null>(null);
  const [enrollTarget, setEnrollTarget] = useState<StudentAccountRow | null>(null);
  const [enrolled, setEnrolled] = useState(false);

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
          !s.firstName.toLowerCase().includes(query) &&
          !s.lastName.toLowerCase().includes(query) &&
          !s.studentId.toLowerCase().includes(query) &&
          !(s.email ?? "").toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }, [studentList, search]);

  const pagination = usePagination(visibleStudents, resetKey);

  async function handleCreateRecord(input: CreateStudentRecordInput) {
    const message = await studentService.createRecord(input);
    if (message) toast.success(message);
    setCreatedRecord(true);
    // Refresh the list so the new student appears.
    studentService.listAccounts().then(setStudentList).catch(() => {});
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
        {(["all", "regular"] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setActiveView(view)}
            className={`-mb-px border-b-2 px-4 py-2 font-body text-sm font-medium transition-colors duration-150 ${
              activeView === view
                ? "border-navy-800 text-navy-800 dark:border-white dark:text-mist-100"
                : "border-transparent text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {view === "all" ? "All Students" : "Regular Students"}
          </button>
        ))}
      </div>

      {activeView === "all" ? (
        <div className="mt-6 flex flex-col gap-4">
          <Input
            id="student-search"
            label="Search"
            type="search"
            placeholder="Name, student ID, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

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
                onCreateAccount={setAccountTarget}
                onView={setViewTarget}
                onEnroll={setEnrollTarget}
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
      ) : (
        <div className="mt-6">
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
          ) : regularStudents.length === 0 ? (
            <EmptyState title="No regular students">
              No students are currently flagged as regular.
            </EmptyState>
          ) : (
            <RegularStudentTable students={regularStudents} />
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
        {viewTarget && <StudentDetailsModal student={viewTarget} />}
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
    </div>
  );
}
