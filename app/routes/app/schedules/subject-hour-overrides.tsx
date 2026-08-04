import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PlusIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { SubjectHourOverrideForm, type OverrideFormInput } from "~/features/schedules/subject-hour-override-form";
import { SubjectHourOverrideTable } from "~/features/schedules/subject-hour-override-table";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { ApiError } from "~/lib/api";
import { scheduleService, type SubjectHourOverride } from "~/services/schedule.service";
import { setService } from "~/services/set.service";
import { subjectService } from "~/services/subject.service";
import { weeklyHourService } from "~/services/weekly-hour-allocation.service";
import type { ClassSet } from "~/types/set";
import type { WeeklyHourAllocation } from "~/types/weekly-hour-allocation";

export function meta() {
  return [
    { title: "Subject Hour Overrides — GWC Class Scheduling" },
    { name: "description", content: "Manage per-subject weekly hour overrides." },
  ];
}

export default function SubjectHourOverrides() {
  return (
    <RoleGuard allow={["registrar"]}>
      <SubjectHourOverridesPage />
    </RoleGuard>
  );
}

function SubjectHourOverridesPage() {
  const { schoolYears, defaultSchoolYear, loading: syLoading } = useSchoolYears();
  const { semesters, semesterLabel, loading: semLoading } = useSemesters();

  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState(1);
  const [overrides, setOverrides] = useState<SubjectHourOverride[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubjectHourOverride | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectHourOverride | null>(null);
  const [pendingOverride, setPendingOverride] = useState<OverrideFormInput | null>(null);

  // Subject/set pickers for the form
  const [subjects, setSubjects] = useState<{ id: number; code: string; title: string; subjectType: string }[]>([]);
  const [sets, setSets] = useState<ClassSet[]>([]);
  const [allocations, setAllocations] = useState<WeeklyHourAllocation[]>([]);

  // Resolve the selected school year and semester number from labels.
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
      .listSubjectHourOverrides({ syId: matchedSy.id, semesterNumber: matchedSem.semesterNumber })
      .then(setOverrides)
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load overrides.");
        setOverrides([]);
      });
  }, [matchedSy?.id, matchedSem?.semesterNumber]);

  // Load subjects and sets for the form pickers (independent of term for browsing)
  useEffect(() => {
    subjectService
      .list()
      .then((subs) => setSubjects(subs.map((s) => ({ id: s.id, code: s.code, title: s.title, subjectType: s.subjectType }))))
      .catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    weeklyHourService.list().then(setAllocations).catch(() => setAllocations([]));
  }, []);

  useEffect(() => {
    if (!matchedSy || !matchedSem) {
      setSets([]);
      return;
    }
    setService
      .list({ syId: matchedSy.id, semesterNumber: matchedSem.semesterNumber })
      .then(setSets)
      .catch(() => setSets([]));
  }, [matchedSy?.id, matchedSem?.semesterNumber]);

  async function refresh() {
    if (!matchedSy || !matchedSem) return;
    const data = await scheduleService.listSubjectHourOverrides({
      syId: matchedSy.id,
      semesterNumber: matchedSem.semesterNumber,
    });
    setOverrides(data);
  }

  async function handleCreate(input: OverrideFormInput) {
    if (!matchedSy || !matchedSem) return;

    // Check if an override already exists for this subject and set
    const existing = overrides?.find(
      (o) =>
        o.subjectId === input.subjectId &&
        ((input.setId == null && o.setId == null) || o.setId === input.setId),
    );

    if (existing) {
      // Show confirmation dialog
      setPendingOverride(input);
      return;
    }

    try {
      const result = await scheduleService.upsertSubjectHourOverride({
        ...input,
        syId: matchedSy.id,
        semesterNumber: matchedSem.semesterNumber,
      });
      toast.success(result.created ? "Override created." : "Override updated.");
      await refresh();
      setCreateOpen(false);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else throw err;
    }
  }

  async function confirmOverwrite() {
    if (!pendingOverride || !matchedSy || !matchedSem) return;
    try {
      const result = await scheduleService.upsertSubjectHourOverride({
        ...pendingOverride,
        syId: matchedSy.id,
        semesterNumber: matchedSem.semesterNumber,
      });
      toast.success(result.created ? "Override created." : "Override updated.");
      await refresh();
      setCreateOpen(false);
      setPendingOverride(null);
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
        semesterNumber: matchedSem.semesterNumber,
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

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-4">
        <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-2">
          <FieldChrome id="sho-school-year" label="School Year">
            <Select
              items={
                syLoading
                  ? [{ value: "", label: "Loading…" }]
                  : schoolYears.length === 0
                    ? [{ value: "", label: "No school year" }]
                    : schoolYears.map((y) => ({ value: y.schoolYear, label: y.schoolYear }))
              }
              value={schoolYear}
              onValueChange={(v) => { setSchoolYear(v as string); setOverrides(null); }}
            >
              <SelectTrigger id="sho-school-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {syLoading ? (
                  <SelectItem value="">Loading…</SelectItem>
                ) : schoolYears.length === 0 ? (
                  <SelectItem value="">No school year</SelectItem>
                ) : (
                  schoolYears.map((y) => (
                    <SelectItem key={y.id} value={y.schoolYear}>
                      {y.schoolYear}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FieldChrome>
          <FieldChrome id="sho-semester" label="Semester">
            <Select
              items={
                semLoading
                  ? [{ value: "", label: "Loading…" }]
                  : semesters.length === 0
                    ? [{ value: "", label: "No semester" }]
                    : semesters
                        .filter((s) => s.semesterNumber !== 3)
                        .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))
              }
              value={semLoading ? "" : String(semester)}
              onValueChange={(v) => { setSemester(Number(v)); setOverrides(null); }}
            >
              <SelectTrigger id="sho-semester">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {semLoading ? (
                  <SelectItem value="">Loading…</SelectItem>
                ) : semesters.length === 0 ? (
                  <SelectItem value="">No semester</SelectItem>
                ) : (
                  semesters.filter((s) => s.semesterNumber !== 3).map((s) => (
                    <SelectItem key={s.semesterNumber} value={String(s.semesterNumber)}>
                      {semesterLabel(s.semesterNumber)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FieldChrome>
        </Card>
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
            subjects={subjects}
            allocations={allocations}
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
          allocations={allocations}
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
            allocations={allocations}
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

      {/* Overwrite confirmation */}
      <ConfirmDialog
        open={pendingOverride !== null}
        onClose={() => setPendingOverride(null)}
        title="Override already exists"
        confirmLabel="Replace"
        loadingLabel="Saving…"
        onConfirm={confirmOverwrite}
      >
        {pendingOverride && (
          <p className="font-body text-sm text-slate-600 dark:text-slate-300">
            An override already exists for{" "}
            <span className="font-medium text-navy-700 dark:text-mist-100">
              {subjects.find((s) => s.id === pendingOverride.subjectId)?.code}
            </span>
            {pendingOverride.setId != null && (
              <> / {sets.find((s) => s.id === pendingOverride.setId)?.program}-{sets.find((s) => s.id === pendingOverride.setId)?.yearLevel}{sets.find((s) => s.id === pendingOverride.setId)?.setCode}</>
            )}
            {pendingOverride.setId == null && " / All sets"}
            . Saving will replace it.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
