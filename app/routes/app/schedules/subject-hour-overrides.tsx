import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { PlusIcon } from "~/components/ui/icons";
import { Spinner } from "~/components/ui/spinner";
import { SubjectHourOverrideForm, type OverrideFormInput } from "~/features/schedules/subject-hour-override-form";
import { SubjectHourOverrideTable } from "~/features/schedules/subject-hour-override-table";
import { PageHeader } from "~/layouts/page-header";
import { ApiError } from "~/lib/api";
import { scheduleService, type SubjectHourOverride } from "~/services/schedule.service";
import { subjectService } from "~/services/subject.service";
import { setService } from "~/services/set.service";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import type { ClassSet } from "~/types/set";

export function meta() {
  return [
    { title: "Subject Hour Overrides — GWC Class Scheduling" },
    { name: "description", content: "Manage per-subject weekly hour overrides." },
  ];
}

export default function SubjectHourOverrides() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <SubjectHourOverridesPage />
    </RoleGuard>
  );
}

function SubjectHourOverridesPage() {
  const { schoolYears, defaultSchoolYear } = useSchoolYears();
  const { semesters, semesterLabel } = useSemesters();

  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState(1);
  const [overrides, setOverrides] = useState<SubjectHourOverride[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubjectHourOverride | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectHourOverride | null>(null);

  // Subject/set pickers for the form
  const [subjects, setSubjects] = useState<{ id: number; code: string; title: string }[]>([]);
  const [sets, setSets] = useState<ClassSet[]>([]);

  // Resolve syId / semId from labels
  const matchedSy = schoolYears.find((s) => s.schoolYear === schoolYear);
  const matchedSem = semesters.find((s) => s.semesterNumber === semester);

  // Default to most recent school year
  useEffect(() => {
    if (schoolYear || schoolYears.length === 0) return;
    setSchoolYear(defaultSchoolYear);
  }, [schoolYear, schoolYears, defaultSchoolYear]);

  // Load overrides when term is selected
  useEffect(() => {
    if (!matchedSy || !matchedSem) {
      setOverrides(null);
      return;
    }
    setOverrides(null);
    setLoadError(null);
    scheduleService
      .listSubjectHourOverrides({ syId: matchedSy.id, semId: matchedSem.id })
      .then(setOverrides)
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load overrides.");
        setOverrides([]);
      });
  }, [matchedSy?.id, matchedSem?.id]);

  // Load subjects and sets for the form pickers (independent of term for browsing)
  useEffect(() => {
    subjectService
      .list()
      .then((subs) => setSubjects(subs.map((s) => ({ id: s.id, code: s.code, title: s.title }))))
      .catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    if (!matchedSy || !matchedSem) {
      setSets([]);
      return;
    }
    setService
      .list({ syId: matchedSy.id, semId: matchedSem.id })
      .then(setSets)
      .catch(() => setSets([]));
  }, [matchedSy?.id, matchedSem?.id]);

  async function refresh() {
    if (!matchedSy || !matchedSem) return;
    const data = await scheduleService.listSubjectHourOverrides({ syId: matchedSy.id, semId: matchedSem.id });
    setOverrides(data);
  }

  async function handleCreate(input: OverrideFormInput) {
    if (!matchedSy || !matchedSem) return;
    try {
      const result = await scheduleService.upsertSubjectHourOverride({
        ...input,
        syId: matchedSy.id,
        semId: matchedSem.id,
      });
      toast.success(result.created ? "Override created." : "Override updated.");
      await refresh();
      setCreateOpen(false);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else throw err;
    }
  }

  async function handleEdit(input: OverrideFormInput) {
    if (!editTarget || !matchedSy || !matchedSem) return;
    try {
      const result = await scheduleService.upsertSubjectHourOverride({
        subjectId: input.subjectId,
        syId: matchedSy.id,
        semId: matchedSem.id,
        setId: input.setId,
        lectureHours: input.lectureHours,
        labHours: input.labHours,
        meetings: input.meetings,
        note: input.note,
      });
      toast.success(result.created ? "Override created." : "Override updated.");
      await refresh();
      setEditTarget(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else throw err;
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const message = await scheduleService.deleteSubjectHourOverride(deleteTarget.id);
      if (message) toast.success(message);
      await refresh();
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else throw err;
    }
  }

  const termReady = Boolean(matchedSy && matchedSem);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Subject Hour Overrides"
        description="Override weekly hours for individual subjects. These take effect the next time you generate a schedule."
        actions={
          <Button
            type="button"
            block={false}
            disabled={!termReady}
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon />
            Add Override
          </Button>
        }
      />

      {/* Term selector */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="sho-sy" className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            School Year
          </label>
          <select
            id="sho-sy"
            value={schoolYear}
            onChange={(e) => { setSchoolYear(e.target.value); setOverrides(null); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:bg-white/5 dark:text-mist-100"
          >
            <option value="">— Select —</option>
            {schoolYears.map((sy) => (
              <option key={sy.id} value={sy.schoolYear}>{sy.schoolYear}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sho-sem" className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Semester
          </label>
          <select
            id="sho-sem"
            value={semester}
            onChange={(e) => { setSemester(Number(e.target.value)); setOverrides(null); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:bg-white/5 dark:text-mist-100"
          >
            {semesters.map((s) => (
              <option key={s.semesterNumber} value={s.semesterNumber}>{s.semester}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overrides table */}
      <div className="mt-6">
        {!termReady ? (
          <EmptyState title="Select a term">
            Pick a school year and semester to view overrides.
          </EmptyState>
        ) : loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : overrides === null ? (
          <div
            role="status"
            aria-label="Loading overrides"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : overrides.length === 0 ? (
          <EmptyState title="No overrides">
            Every subject uses the hours set for its subject type.
          </EmptyState>
        ) : (
          <SubjectHourOverrideTable
            overrides={overrides}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Override">
        <SubjectHourOverrideForm
          subjects={subjects}
          sets={sets}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Override">
        {editTarget && (
          <SubjectHourOverrideForm
            subjects={subjects}
            sets={sets}
            initial={{
              subjectId: editTarget.subjectId,
              subjectCode: editTarget.subjectCode,
              setId: editTarget.setId,
              setName: editTarget.setName,
              lectureHours: editTarget.lectureHours,
              labHours: editTarget.labHours,
              meetings: editTarget.meetings,
              note: editTarget.note,
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete override">
        <div className="flex flex-col gap-4">
          <p className="font-body text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-navy-700 dark:text-mist-100">
              {deleteTarget?.subjectCode}
            </span>{" "}
            will go back to using the hours configured for its subject type. This takes effect the next time you generate.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" block={false} onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              block={false}
              isLoading={false}
              loadingLabel="Deleting…"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
