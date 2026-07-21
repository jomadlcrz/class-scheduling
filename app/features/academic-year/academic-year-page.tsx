import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { SchoolYearForm } from "~/features/academic-year/school-year-form";
import { SchoolYearTable } from "~/features/academic-year/school-year-table";
import { SemesterForm } from "~/features/academic-year/semester-form";
import { SemesterTable } from "~/features/academic-year/semester-table";
import { PageHeader } from "~/layouts/page-header";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import type { CreateSemesterInput, Semester } from "~/types/semester";

export function AcademicYearPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Academic Year"
        description="Manage school years and semesters used across scheduling."
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SchoolYearsSection />
        <SemestersSection />
      </div>
    </div>
  );
}

function SchoolYearsSection() {
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SchoolYearOption | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolYearOption | null>(null);

  function refresh() {
    schoolYearService.list().then(setSchoolYears).catch(() => setSchoolYears([]));
  }

  useEffect(refresh, []);

  async function handleAdd(schoolYear: string) {
    const message = await schoolYearService.create(schoolYear);
    if (message) toast.success(message);
    refresh();
    setAddOpen(false);
  }

  // Edit/Delete are mock UI only — the backend has no update/delete endpoints for
  // school years yet, so these mutate local state without calling the API.
  async function handleEdit(schoolYear: string) {
    if (!editTarget) return;
    setSchoolYears((curr) =>
      (curr ?? []).map((sy) => (sy.id === editTarget.id ? { ...sy, schoolYear } : sy)),
    );
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSchoolYears((curr) => (curr ?? []).filter((sy) => sy.id !== deleteTarget.id));
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-body text-base font-semibold text-navy-700 dark:text-mist-100">
          School Years
        </h2>
        <Button type="button" block={false} onClick={() => setAddOpen(true)}>
          <PlusIcon />
          Add
        </Button>
      </div>

      {schoolYears === null ? (
        <div
          role="status"
          aria-label="Loading school years"
          className="grid place-items-center py-8 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : schoolYears.length === 0 ? (
        <EmptyState title="No school years yet">Add the first school year to get started.</EmptyState>
      ) : (
        <SchoolYearTable
          schoolYears={schoolYears}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add School Year">
        <SchoolYearForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit School Year">
        {editTarget && (
          <SchoolYearForm
            initialValue={editTarget.schoolYear}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete school year"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={handleDelete}
      >
        School year{" "}
        <span className="font-medium text-navy-700 dark:text-white">
          {deleteTarget?.schoolYear}
        </span>{" "}
        will be removed.
      </ConfirmDialog>
    </Card>
  );
}

function SemestersSection() {
  const [semesters, setSemesters] = useState<Semester[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Semester | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Semester | null>(null);

  function refresh() {
    semesterService.list().then(setSemesters).catch(() => setSemesters([]));
  }

  useEffect(refresh, []);

  async function handleAdd(input: CreateSemesterInput) {
    const message = await semesterService.create(input);
    if (message) toast.success(message);
    refresh();
    setAddOpen(false);
  }

  // Edit/Delete are mock UI only — the backend has no update/delete endpoints for
  // semesters yet, so these mutate local state without calling the API.
  async function handleEdit(input: CreateSemesterInput) {
    if (!editTarget) return;
    setSemesters((curr) =>
      (curr ?? []).map((s) => (s.id === editTarget.id ? { ...s, ...input } : s)),
    );
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSemesters((curr) => (curr ?? []).filter((s) => s.id !== deleteTarget.id));
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-body text-base font-semibold text-navy-700 dark:text-mist-100">
          Semesters
        </h2>
        <Button type="button" block={false} onClick={() => setAddOpen(true)}>
          <PlusIcon />
          Add
        </Button>
      </div>

      {semesters === null ? (
        <div
          role="status"
          aria-label="Loading semesters"
          className="grid place-items-center py-8 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : semesters.length === 0 ? (
        <EmptyState title="No semesters yet">Add the first semester to get started.</EmptyState>
      ) : (
        <SemesterTable semesters={semesters} onEdit={setEditTarget} onDelete={setDeleteTarget} />
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Semester">
        <SemesterForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Semester">
        {editTarget && (
          <SemesterForm
            semester={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete semester"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={handleDelete}
      >
        Semester{" "}
        <span className="font-medium text-navy-700 dark:text-white">{deleteTarget?.semester}</span>{" "}
        will be removed.
      </ConfirmDialog>
    </Card>
  );
}
