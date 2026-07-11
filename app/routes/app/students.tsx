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
import { ActivateStudentDialog } from "~/features/students/activate-student-dialog";
import { DeactivateStudentDialog } from "~/features/students/deactivate-student-dialog";
import { StudentForm } from "~/features/students/student-form";
import { StudentTable } from "~/features/students/student-table";
import { PageHeader } from "~/layouts/page-header";
import { programService } from "~/services/program.service";
import { studentService } from "~/services/student.service";
import { usePagination } from "~/hooks/use-pagination";
import type { Program } from "~/types/program";
import type { CreateStudentInput, Student, StudentStatus } from "~/types/student";

export function meta() {
  return [
    { title: "Students — GWC Class Scheduling" },
    { name: "description", content: "Manage enrolled students and their section assignments." },
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
  const [studentList, setStudentList] = useState<Student[] | null>(null);
  const [programs, setPrograms] = useState<Program[] | null>(null);

  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [activateTarget, setActivateTarget] = useState<Student | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Student | null>(null);

  // useEffect(() => {
  //   Promise.all([studentService.list(), programService.list()]).then(([s, p]) => {
  //     setStudentList(s);
  //     setPrograms(p);
  //   });
  // }, []);

  const resetKey = `${search}|${programFilter}|${statusFilter}`;

  const visibleStudents = useMemo(() => {
    if (!studentList) return [];
    const query = search.trim().toLowerCase();
    return studentList
      .filter((s) => {
        if (programFilter !== "all" && s.program !== programFilter) return false;
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (
          query &&
          !s.firstName.toLowerCase().includes(query) &&
          !s.lastName.toLowerCase().includes(query) &&
          !s.studentNumber.includes(query) &&
          !s.email.toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }, [studentList, search, programFilter, statusFilter, resetKey]);

  const pagination = usePagination(visibleStudents, resetKey);

  // async function handleCreate(input: CreateStudentInput) {
  //   const created = await studentService.create(input);
  //   setStudentList((cur) => [...(cur ?? []), created]);
  //   setCreateOpen(false);
  // }

  // async function handleEdit(input: CreateStudentInput) {
  //   if (!editTarget) return;
  //   const updated = await studentService.update(editTarget.id, input);
  //   setStudentList((cur) => cur!.map((s) => (s.id === updated.id ? updated : s)));
  //   setEditTarget(null);
  // }

  // async function handleSetStatus(target: Student, status: StudentStatus) {
  //   const updated = await studentService.setStatus(target.id, status);
  //   setStudentList((cur) => cur!.map((s) => (s.id === updated.id ? updated : s)));
  // }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Students"
        description="Enrolled students and their section assignments."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Student
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <Input
              id="student-search"
              label="Search"
              type="search"
              placeholder="Name, student number, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            id="student-program-filter"
            label="Program"
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
          >
            <option value="all">All programs</option>
            {(programs ?? []).map((p) => (
              <option key={p.id} value={p.code}>
                {p.code}
              </option>
            ))}
          </Select>
          <Select
            id="student-status-filter"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="enrolled">Enrolled</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
          </Select>
        </div>

        <ResultState tone="error" title="Not available">
          This feature is not connected to the backend yet.
        </ResultState>
      </div>

      {/* <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Student">
        <StudentForm
          programs={programs ?? []}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Student">
        {editTarget && (
          <StudentForm
            student={editTarget}
            programs={programs ?? []}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <DeactivateStudentDialog
        student={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={(student) => handleSetStatus(student, "inactive")}
      />
      <ActivateStudentDialog
        student={activateTarget}
        onClose={() => setActivateTarget(null)}
        onConfirm={(student) => handleSetStatus(student, "enrolled")}
      /> */}
    </div>
  );
}
