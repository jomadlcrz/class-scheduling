import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { ResultState } from "~/components/feedback/result-state";
import { StudentAccountForm } from "~/features/students/student-account-form";
import { StudentAccountTable } from "~/features/students/student-account-table";
import { StudentRecordForm } from "~/features/students/student-record-form";
import { PageHeader } from "~/layouts/page-header";
import { enumService, type EnumOptions } from "~/services/enum.service";
import { programService } from "~/services/program.service";
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
  const [accountFilter, setAccountFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [createdRecord, setCreatedRecord] = useState(false);
  const [accountTarget, setAccountTarget] = useState<StudentAccountRow | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

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

  const resetKey = `${search}|${accountFilter}`;

  const visibleStudents = useMemo(() => {
    if (!studentList) return [];
    const query = search.trim().toLowerCase();
    return studentList
      .filter((s) => {
        if (accountFilter === "with" && !s.hasAccount) return false;
        if (accountFilter === "without" && s.hasAccount) return false;
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
  }, [studentList, search, accountFilter]);

  const pagination = usePagination(visibleStudents, resetKey);

  async function handleCreateRecord(input: CreateStudentRecordInput) {
    await studentService.createRecord(input);
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
    await studentService.createAccount(accountTarget.studentProfileId, input);
    setCreatedEmail(input.email);
    // Refresh the list so the account status updates.
    studentService.listAccounts().then(setStudentList).catch(() => {});
  }

  function closeAccountModal() {
    setAccountTarget(null);
    setCreatedEmail(null);
  }

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

      <div className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <Input
            id="student-search"
            label="Search"
            type="search"
            placeholder="Name, student ID, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            id="student-account-filter"
            label="Account"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
          >
            <option value="all">All students</option>
            <option value="with">With account</option>
            <option value="without">No account</option>
          </Select>
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
              onCreateAccount={setAccountTarget}
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

      <Modal open={createOpen} onClose={closeCreate} title="New Student" wide={!createdRecord}>
        {createdRecord ? (
          <div className="flex flex-col items-center gap-4">
            <ResultState tone="success" title="Student registered">
              The student record was created. Use “Create Account” on the student’s row to set
              up their login.
            </ResultState>
            <Button type="button" block={false} onClick={closeCreate}>
              <span className="px-4">Done</span>
            </Button>
          </div>
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
          <div className="flex flex-col items-center gap-4">
            <ResultState tone="success" title="Account created">
              Login credentials with a temporary password were emailed to {createdEmail}.
            </ResultState>
            <Button type="button" block={false} onClick={closeAccountModal}>
              <span className="px-4">Done</span>
            </Button>
          </div>
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
    </div>
  );
}
