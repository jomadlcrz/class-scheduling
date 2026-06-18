import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "../../auth/role-guard";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { PlusIcon } from "../../components/ui/icons";
import { ConfirmDialog, Modal } from "../../components/ui/modal";
import { Spinner } from "../../components/ui/spinner";
import { AcademicYearForm } from "../../features/academic-years/academic-year-form";
import { AcademicYearTable } from "../../features/academic-years/academic-year-table";
import { SemesterForm } from "../../features/semesters/semester-form";
import { SemesterTable } from "../../features/semesters/semester-table";
import { PageHeader } from "../../layouts/page-header";
import { academicYearService } from "../../services/academic-year.service";
import { semesterService } from "../../services/semester.service";
import type { AcademicYear, CreateAcademicYearInput } from "../../types/academic-year";
import type { AcademicSemester, CreateAcademicSemesterInput } from "../../types/semester";
import { SEMESTER_LABELS } from "../../types/subject";

export function meta() {
  return [
    { title: "Academic Years — GWC Class Scheduling" },
    { name: "description", content: "Manage academic years and their semesters." },
  ];
}

export default function AcademicYears() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <AcademicYearsPage />
    </RoleGuard>
  );
}

function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[] | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [semesters, setSemesters] = useState<AcademicSemester[] | null>(null);

  const [createYearOpen, setCreateYearOpen] = useState(false);
  const [editYear, setEditYear] = useState<AcademicYear | null>(null);
  const [deleteYear, setDeleteYear] = useState<AcademicYear | null>(null);

  const [createSemOpen, setCreateSemOpen] = useState(false);
  const [editSem, setEditSem] = useState<AcademicSemester | null>(null);
  const [deleteSem, setDeleteSem] = useState<AcademicSemester | null>(null);

  useEffect(() => {
    academicYearService.list().then((data) => {
      const sorted = data.sort((a, b) => b.label.localeCompare(a.label));
      setYears(sorted);
      const activeYear = sorted.find((y) => y.status === "active") ?? sorted[0];
      if (activeYear) setSelectedYearId(activeYear.id);
    });
  }, []);

  useEffect(() => {
    if (!selectedYearId) return;
    setSemesters(null);
    semesterService.list(selectedYearId).then((data) => {
      setSemesters(data.sort((a, b) => a.semester - b.semester));
    });
  }, [selectedYearId]);

  const sortedYears = useMemo(
    () => (years ?? []).sort((a, b) => b.label.localeCompare(a.label)),
    [years],
  );

  const selectedYear = useMemo(
    () => (years ?? []).find((y) => y.id === selectedYearId) ?? null,
    [years, selectedYearId],
  );

  async function handleCreateYear(input: CreateAcademicYearInput) {
    const created = await academicYearService.create(input);
    setYears((curr) => [...(curr ?? []), created]);
    setCreateYearOpen(false);
  }

  async function handleEditYear(input: CreateAcademicYearInput) {
    if (!editYear) return;
    const updated = await academicYearService.update(editYear.id, input);
    setYears((curr) => curr!.map((y) => (y.id === updated.id ? updated : y)));
    setEditYear(null);
  }

  async function handleDeleteYear(target: AcademicYear) {
    await academicYearService.remove(target.id);
    setYears((curr) => curr!.filter((y) => y.id !== target.id));
    if (selectedYearId === target.id) setSelectedYearId(null);
  }

  async function handleCreateSemester(input: CreateAcademicSemesterInput) {
    const created = await semesterService.create(input);
    setSemesters((curr) => [...(curr ?? []), created].sort((a, b) => a.semester - b.semester));
    setCreateSemOpen(false);
  }

  async function handleEditSemester(input: CreateAcademicSemesterInput) {
    if (!editSem) return;
    const updated = await semesterService.update(editSem.id, input);
    setSemesters((curr) =>
      curr!
        .map((s) => (s.id === updated.id ? updated : s))
        .sort((a, b) => a.semester - b.semester),
    );
    setEditSem(null);
  }

  async function handleDeleteSemester(target: AcademicSemester) {
    await semesterService.remove(target.id);
    setSemesters((curr) => curr!.filter((s) => s.id !== target.id));
  }

  return (
    <>
      <PageHeader
        title="Academic Years"
        description="Manage school years and their semesters."
        actions={
          <Button type="button" block={false} onClick={() => setCreateYearOpen(true)}>
            <PlusIcon />
            New Academic Year
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-8">
        {/* Academic Years */}
        <section>
          {years === null ? (
            <div className="grid place-items-center py-12 text-navy-700 dark:text-slate-200">
              <Spinner />
            </div>
          ) : sortedYears.length === 0 ? (
            <EmptyState title="No academic years">
              Add an academic year to get started.
            </EmptyState>
          ) : (
            <AcademicYearTable
              academicYears={sortedYears}
              selectedId={selectedYearId}
              onSelect={(y) => setSelectedYearId(y.id)}
              onEdit={(y) => setEditYear(y)}
              onDelete={(y) => setDeleteYear(y)}
            />
          )}
        </section>

        {/* Semesters for selected year */}
        {selectedYear && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-white">
                Semesters — {selectedYear.label}
              </h2>
              <Button type="button" block={false} onClick={() => setCreateSemOpen(true)}>
                <PlusIcon />
                Add Semester
              </Button>
            </div>

            {semesters === null ? (
              <div className="grid place-items-center py-8 text-navy-700 dark:text-slate-200">
                <Spinner />
              </div>
            ) : semesters.length === 0 ? (
              <EmptyState title="No semesters">
                No semesters added for {selectedYear.label} yet.
              </EmptyState>
            ) : (
              <SemesterTable
                semesters={semesters}
                onEdit={(s) => setEditSem(s)}
                onDelete={(s) => setDeleteSem(s)}
              />
            )}
          </section>
        )}
      </div>

      {/* Academic Year modals */}
      <Modal open={createYearOpen} onClose={() => setCreateYearOpen(false)} title="New Academic Year">
        <AcademicYearForm onSubmit={handleCreateYear} onCancel={() => setCreateYearOpen(false)} />
      </Modal>

      <Modal open={editYear !== null} onClose={() => setEditYear(null)} title="Edit Academic Year">
        {editYear && (
          <AcademicYearForm
            academicYear={editYear}
            onSubmit={handleEditYear}
            onCancel={() => setEditYear(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteYear !== null}
        onClose={() => setDeleteYear(null)}
        title="Delete academic year"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={() => handleDeleteYear(deleteYear!)}
      >
        Academic year{" "}
        <span className="font-medium text-navy-700 dark:text-white">{deleteYear?.label}</span>{" "}
        and all its semesters will be permanently removed.
      </ConfirmDialog>

      {/* Semester modals */}
      {selectedYear && (
        <>
          <Modal open={createSemOpen} onClose={() => setCreateSemOpen(false)} title="Add Semester">
            <SemesterForm
              academicYearId={selectedYear.id}
              academicYearLabel={selectedYear.label}
              onSubmit={handleCreateSemester}
              onCancel={() => setCreateSemOpen(false)}
            />
          </Modal>

          <Modal open={editSem !== null} onClose={() => setEditSem(null)} title="Edit Semester">
            {editSem && (
              <SemesterForm
                academicYearId={selectedYear.id}
                academicYearLabel={selectedYear.label}
                semester={editSem}
                onSubmit={handleEditSemester}
                onCancel={() => setEditSem(null)}
              />
            )}
          </Modal>
        </>
      )}

      <ConfirmDialog
        open={deleteSem !== null}
        onClose={() => setDeleteSem(null)}
        title="Delete semester"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={() => handleDeleteSemester(deleteSem!)}
      >
        {deleteSem && (
          <>
            <span className="font-medium text-navy-700 dark:text-white">
              {SEMESTER_LABELS[deleteSem.semester]}
            </span>{" "}
            of {deleteSem.academicYearLabel} will be permanently removed.
          </>
        )}
      </ConfirmDialog>
    </>
  );
}
