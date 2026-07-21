import { useEffect, useState } from "react";
import {
  AcademicPeriodForm,
  type AcademicPeriodFormValue,
} from "~/features/academic-year/academic-period-form";
import {
  AcademicPeriodTable,
  type AcademicPeriodRow,
} from "~/features/academic-year/academic-period-table";
import type { AcademicPeriodStatus } from "~/features/academic-year/academic-year-status";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { PageHeader } from "~/layouts/page-header";
import { schoolYearService } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";

// This page is a full mock UI, matching the old pre-backend academic-year prototype:
// the initial rows are seeded from the real backend (read-only) so existing school
// years/semesters stay visible, but every mutation below (add/edit/delete/status)
// is local-only — nothing here calls a write endpoint or persists.
let nextPeriodId = -1;
function newPeriodId() {
  return nextPeriodId--;
}

function inferYearPhase(schoolYear: string): "past" | "current" | "future" {
  const startYear = Number(schoolYear.split("-")[0]);
  const currentYear = new Date().getFullYear();
  if (Number.isNaN(startYear)) return "future";
  if (startYear < currentYear) return "past";
  if (startYear > currentYear) return "future";
  return "current";
}

function buildInitialPeriods(
  schoolYears: { schoolYear: string }[],
  semesters: { semester: string; semesterNumber: number }[],
): AcademicPeriodRow[] {
  const sortedSemesters = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);
  const periods: AcademicPeriodRow[] = [];

  for (const sy of schoolYears) {
    const phase = inferYearPhase(sy.schoolYear);
    sortedSemesters.forEach((sem, index) => {
      let status: AcademicPeriodStatus;
      if (phase === "past") status = "completed";
      else if (phase === "future") status = "upcoming";
      else status = index === 0 ? "active" : "upcoming";

      periods.push({
        id: newPeriodId(),
        schoolYear: sy.schoolYear,
        semester: sem.semester,
        semesterNumber: sem.semesterNumber,
        status,
      });
    });
  }

  return periods.sort(
    (a, b) => b.schoolYear.localeCompare(a.schoolYear) || a.semesterNumber - b.semesterNumber,
  );
}

export function AcademicYearPage() {
  const [periods, setPeriods] = useState<AcademicPeriodRow[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AcademicPeriodRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AcademicPeriodRow | null>(null);

  useEffect(() => {
    Promise.all([schoolYearService.list(), semesterService.list()])
      .then(([schoolYears, semesters]) => setPeriods(buildInitialPeriods(schoolYears, semesters)))
      .catch(() => setPeriods([]));
  }, []);

  function isDuplicate(value: AcademicPeriodFormValue, excludeId?: number) {
    return (periods ?? []).some(
      (p) =>
        p.id !== excludeId &&
        p.schoolYear.toLowerCase() === value.schoolYear.toLowerCase() &&
        p.semesterNumber === value.semesterNumber,
    );
  }

  async function handleAdd(value: AcademicPeriodFormValue) {
    if (isDuplicate(value))
      throw new Error(`${value.semester} for ${value.schoolYear} already exists.`);

    const created: AcademicPeriodRow = { id: newPeriodId(), ...value };
    setPeriods((curr) =>
      [...(curr ?? []), created].sort(
        (a, b) => b.schoolYear.localeCompare(a.schoolYear) || a.semesterNumber - b.semesterNumber,
      ),
    );
    setAddOpen(false);
  }

  async function handleEdit(value: AcademicPeriodFormValue) {
    if (!editTarget) return;
    if (isDuplicate(value, editTarget.id))
      throw new Error(`${value.semester} for ${value.schoolYear} already exists.`);

    setPeriods((curr) =>
      (curr ?? [])
        .map((p) => (p.id === editTarget.id ? { ...p, ...value } : p))
        .sort((a, b) => b.schoolYear.localeCompare(a.schoolYear) || a.semesterNumber - b.semesterNumber),
    );
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPeriods((curr) => (curr ?? []).filter((p) => p.id !== deleteTarget.id));
  }

  const currentPeriod = (periods ?? []).find((p) => p.status === "active") ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Academic Years"
        description="Manage school years and their semesters."
        actions={
          <Button type="button" block={false} onClick={() => setAddOpen(true)}>
            <PlusIcon />
            Add Academic Period
          </Button>
        }
      />

      <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Current Academic Period
          </p>
          <p className="mt-1 font-display text-xl tracking-wide text-navy-700 dark:text-white">
            {currentPeriod
              ? `SY ${currentPeriod.schoolYear} · ${currentPeriod.semester}`
              : "No active academic period set"}
          </p>
        </div>
        {currentPeriod && <Badge tone="emerald">Active</Badge>}
      </Card>

      <div className="mt-6">
        {periods === null ? (
          <div
            role="status"
            aria-label="Loading academic periods"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : periods.length === 0 ? (
          <EmptyState title="No academic periods yet">
            Add the first school year and semester to get started.
          </EmptyState>
        ) : (
          <AcademicPeriodTable periods={periods} onEdit={setEditTarget} onDelete={setDeleteTarget} />
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Academic Period">
        <AcademicPeriodForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Academic Period">
        {editTarget && (
          <AcademicPeriodForm
            initialValue={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete academic period"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={handleDelete}
      >
        <span className="font-medium text-navy-700 dark:text-white">
          {deleteTarget?.semester} of {deleteTarget?.schoolYear}
        </span>{" "}
        will be removed.
      </ConfirmDialog>
    </div>
  );
}
