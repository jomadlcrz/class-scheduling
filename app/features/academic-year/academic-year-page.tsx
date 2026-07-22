import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { PageHeader } from "~/layouts/page-header";
import { SchoolYearForm } from "~/features/academic-year/school-year-form";
import { SchoolYearTable } from "~/features/academic-year/school-year-table";
import { SemesterForm, type SemesterFormValue } from "~/features/academic-year/semester-form";
import { SemesterTable } from "~/features/academic-year/semester-table";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import type { Semester } from "~/types/semester";

export function AcademicYearPage() {
  const { schoolYears, loading: loadingSchoolYears, refresh: refreshSchoolYears } = useSchoolYears();
  const { semesters, loading: loadingSemesters, refresh: refreshSemesters } = useSemesters();

  const [addSchoolYearOpen, setAddSchoolYearOpen] = useState(false);
  const [editSchoolYear, setEditSchoolYear] = useState<SchoolYearOption | null>(null);
  const [deleteSchoolYear, setDeleteSchoolYear] = useState<SchoolYearOption | null>(null);

  const [addSemesterOpen, setAddSemesterOpen] = useState(false);
  const [editSemester, setEditSemester] = useState<Semester | null>(null);
  const [deleteSemester, setDeleteSemester] = useState<Semester | null>(null);

  async function handleAddSchoolYear(schoolYear: string) {
    const message = await schoolYearService.create(schoolYear);
    if (message) toast.success(message);
    setAddSchoolYearOpen(false);
    await refreshSchoolYears();
  }

  async function handleEditSchoolYear(schoolYear: string) {
    if (!editSchoolYear) return;
    const message = await schoolYearService.update(editSchoolYear.id, schoolYear);
    if (message) toast.success(message);
    setEditSchoolYear(null);
    await refreshSchoolYears();
  }

  async function handleDeleteSchoolYear() {
    if (!deleteSchoolYear) return;
    const message = await schoolYearService.remove(deleteSchoolYear.id);
    if (message) toast.success(message);
    await refreshSchoolYears();
  }

  async function handleAddSemester(value: SemesterFormValue) {
    const message = await semesterService.create(value);
    if (message) toast.success(message);
    setAddSemesterOpen(false);
    await refreshSemesters();
  }

  async function handleEditSemester(value: SemesterFormValue) {
    if (!editSemester) return;
    const message = await semesterService.update(editSemester.id, value);
    if (message) toast.success(message);
    setEditSemester(null);
    await refreshSemesters();
  }

  async function handleDeleteSemester() {
    if (!deleteSemester) return;
    const message = await semesterService.remove(deleteSemester.id);
    if (message) toast.success(message);
    await refreshSemesters();
  }

  const currentSchoolYear = schoolYears[0] ?? null;
  const currentSemester = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber)[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="Academic Years" description="Manage school years and their semesters." />

      <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Current Academic Period
          </p>
          <p className="mt-1 font-display text-xl tracking-wide text-navy-700 dark:text-white">
            {currentSchoolYear && currentSemester
              ? `SY ${currentSchoolYear.schoolYear} · ${currentSemester.semester}`
              : "No academic period set"}
          </p>
        </div>
        {currentSchoolYear && currentSemester && <Badge tone="emerald">Active</Badge>}
      </Card>

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-white">School Years</h2>
          <Button type="button" block={false} onClick={() => setAddSchoolYearOpen(true)}>
            <PlusIcon />
            Add School Year
          </Button>
        </div>
        {loadingSchoolYears ? (
          <div role="status" aria-label="Loading school years" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : schoolYears.length === 0 ? (
          <EmptyState title="No school years yet">Add the first school year to get started.</EmptyState>
        ) : (
          <SchoolYearTable schoolYears={schoolYears} onEdit={setEditSchoolYear} onDelete={setDeleteSchoolYear} />
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-white">Semesters</h2>
          <Button type="button" block={false} onClick={() => setAddSemesterOpen(true)}>
            <PlusIcon />
            Add Semester
          </Button>
        </div>
        {loadingSemesters ? (
          <div role="status" aria-label="Loading semesters" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : semesters.length === 0 ? (
          <EmptyState title="No semesters yet">Add the first semester to get started.</EmptyState>
        ) : (
          <SemesterTable semesters={semesters} onEdit={setEditSemester} onDelete={setDeleteSemester} />
        )}
      </div>

      <Modal open={addSchoolYearOpen} onClose={() => setAddSchoolYearOpen(false)} title="Add School Year">
        <SchoolYearForm onSubmit={handleAddSchoolYear} onCancel={() => setAddSchoolYearOpen(false)} />
      </Modal>
      <Modal open={editSchoolYear !== null} onClose={() => setEditSchoolYear(null)} title="Edit School Year">
        {editSchoolYear && (
          <SchoolYearForm
            initialValue={editSchoolYear.schoolYear}
            onSubmit={handleEditSchoolYear}
            onCancel={() => setEditSchoolYear(null)}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={deleteSchoolYear !== null}
        onClose={() => setDeleteSchoolYear(null)}
        title="Delete school year"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={handleDeleteSchoolYear}
      >
        <span className="font-medium text-navy-700 dark:text-white">{deleteSchoolYear?.schoolYear}</span> will be
        removed.
      </ConfirmDialog>

      <Modal open={addSemesterOpen} onClose={() => setAddSemesterOpen(false)} title="Add Semester">
        <SemesterForm onSubmit={handleAddSemester} onCancel={() => setAddSemesterOpen(false)} />
      </Modal>
      <Modal open={editSemester !== null} onClose={() => setEditSemester(null)} title="Edit Semester">
        {editSemester && (
          <SemesterForm
            initialValue={{ semester: editSemester.semester, semesterNumber: editSemester.semesterNumber }}
            onSubmit={handleEditSemester}
            onCancel={() => setEditSemester(null)}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={deleteSemester !== null}
        onClose={() => setDeleteSemester(null)}
        title="Delete semester"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={handleDeleteSemester}
      >
        <span className="font-medium text-navy-700 dark:text-white">{deleteSemester?.semester}</span> will be removed.
      </ConfirmDialog>
    </div>
  );
}
