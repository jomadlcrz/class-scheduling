import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { StudentForm } from "~/features/students/student-form";
import { StudentTable } from "~/features/students/student-table";
import { PageHeader } from "~/layouts/page-header";
import { programService } from "~/services/program.service";
import { scheduleService } from "~/services/schedule.service";
import { studentService } from "~/services/student.service";
import { usePagination } from "~/hooks/use-pagination";
import type { Program } from "~/types/program";
import type { Schedule } from "~/types/schedule";
import type { CreateStudentInput, Student } from "~/types/student";

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
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);

  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  useEffect(() => {
    Promise.all([
      studentService.list(),
      programService.list(),
      scheduleService.list(),
    ]).then(([s, p, sch]) => {
      setStudentList(s);
      setPrograms(p);
      setSchedules(sch);
    });
  }, []);

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

  async function handleCreate(input: CreateStudentInput) {
    const created = await studentService.create(input);
    setStudentList((cur) => [...(cur ?? []), created]);
    setCreateOpen(false);
  }

  async function handleEdit(input: CreateStudentInput) {
    if (!editTarget) return;
    const updated = await studentService.update(editTarget.id, input);
    setStudentList((cur) => cur!.map((s) => (s.id === updated.id ? updated : s)));
    setEditTarget(null);
  }

  async function handleDelete(target: Student) {
    await studentService.remove(target.id);
    setStudentList((cur) => cur!.filter((s) => s.id !== target.id));
  }

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

        {studentList === null ? (
          <div
            role="status"
            aria-label="Loading students"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleStudents.length === 0 ? (
          <EmptyState title="No students found">
            No students match the current filters. Adjust the search or add a new student.
          </EmptyState>
        ) : (
          <>
            <StudentTable
              students={pagination.pageItems}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Student">
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remove student"
        confirmLabel="Remove"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget!)}
      >
        <span className="font-medium text-navy-700 dark:text-white">
          {deleteTarget?.firstName} {deleteTarget?.lastName} ({deleteTarget?.studentNumber})
        </span>{" "}
        will be permanently removed.
      </ConfirmDialog>
    </div>
  );
}
