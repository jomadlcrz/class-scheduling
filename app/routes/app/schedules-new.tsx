import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Drawer } from "~/components/ui/drawer";
import { AlertIcon, AlertTriangleIcon, PlusIcon, RotateIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { AddSchoolYearForm } from "~/features/schedules/add-school-year-form";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "~/features/schedules/schedule-view-toggle";
import { SlotEntryForm, type PendingSlot } from "~/features/schedules/slot-entry-form";
import { useDays } from "~/hooks/use-days";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import { PageHeader } from "~/layouts/page-header";
import { programService } from "~/services/program.service";
import {
  scheduleService,
  type ScheduleRoomOption,
  type ScheduleSubjectOption,
} from "~/services/schedule.service";
import { schoolYearService } from "~/services/school-year.service";
import { setService } from "~/services/set.service";

import type { Program } from "~/types/program";
import {
  formatTime,
  type Day,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";
import type { ClassSet } from "~/types/set";
import type { YearLevel } from "~/types/subject";


const SUBJECT_CODE_RE = /\b([A-Z]{2,4}\d{3,4})\b/g;

function highlightSubjectCode(text: string) {
  const parts = text.split(SUBJECT_CODE_RE);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  );
}


function ZapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function meta() {
  return [
    { title: "New Schedule — GWC Class Scheduling" },
    { name: "description", content: "Build a week schedule for a set." },
  ];
}

export default function SchedulesNew() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <SchedulesNewPage />
    </RoleGuard>
  );
}

function SchedulesNewPage() {
  const navigate = useNavigate();
  const { semesters, semesterLabel } = useSemesters();
  const { schoolYears, defaultSchoolYear, refresh: refreshSchoolYears } = useSchoolYears();
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const { dayLabels } = useDays();

  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [sets, setSets] = useState<ClassSet[]>([]);
  const [rooms, setRooms] = useState<ScheduleRoomOption[]>([]);
  const [subjects, setSubjects] = useState<ScheduleSubjectOption[]>([]);
  const [scheduledSetIds, setScheduledSetIds] = useState<Set<number>>(new Set());

  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState<YearLevel | "">("");
  const [selectedSetId, setSelectedSetId] = useState("");
  const [addSchoolYearOpen, setAddSchoolYearOpen] = useState(false);

  const [slots, setSlots] = useState<PendingSlot[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editing, setEditing] = useState<PendingSlot | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generationConflicts, setGenerationConflicts] = useState<string[]>([]);
  const tempIdCounter = useRef(0);

  const isDirty = slots.length > 0 || isGenerating;
  const [reloadPromptOpen, setReloadPromptOpen] = useState(false);
  const reloadConfirmed = useRef(false);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (reloadConfirmed.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const isReload =
        e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r");
      if (!isReload) return;
      e.preventDefault();
      setReloadPromptOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDirty]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isSaving && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    scheduleService.listScheduleRooms().then(setRooms).catch(() => setRooms([]));
    scheduleService
      .getSetsWithSchedules()
      .then(setScheduledSetIds)
      .catch(() => setScheduledSetIds(new Set()));
  }, []);

  // Default to the most recent school year once the list loads; a manual pick isn't overridden.
  useEffect(() => {
    if (schoolYear || schoolYears.length === 0) return;
    setSchoolYear(defaultSchoolYear);
  }, [schoolYear, schoolYears, defaultSchoolYear]);

  // Re-fetch sets whenever the context changes so already-scheduled sets are excluded.
  const matchedSy = schoolYears.find((s) => s.schoolYear === schoolYear);
  const matchedSem = semesters.find((s) => s.semesterNumber === semester);
  useEffect(() => {
    if (!matchedSy || !matchedSem || !selectedProgramId) return;
    setSets([]);
    setService
      .list({
        syId: matchedSy.id,
        semId: matchedSem.id,
        programId: Number(selectedProgramId),
      })
      .then(setSets)
      .catch(() => setSets([]));
  }, [matchedSy?.id, matchedSem?.id, selectedProgramId]);

  const selectedProgram = programs?.find((p) => String(p.id) === selectedProgramId);
  const selectedSet = sets.find((s) => String(s.id) === selectedSetId);
  const schoolYearValid = /^\d{4}-\d{4}$/.test(schoolYear);

  // Subjects (with their term-assigned faculties) depend on the whole context.
  useEffect(() => {
    if (!selectedProgram || !selectedYearLevel || !schoolYearValid) {
      setSubjects([]);
      return;
    }
    let stale = false;
    scheduleService
      .listScheduleSubjects({
        schoolYear,
        programId: selectedProgram.id,
        yearLevel: selectedYearLevel,
        semester,
      })
      .then((result) => {
        if (!stale) setSubjects(result);
      })
      .catch(() => {
        if (!stale) setSubjects([]);
      });
    return () => {
      stale = true;
    };
  }, [selectedProgram, selectedYearLevel, semester, schoolYear, schoolYearValid]);

  const availableYearLevels = useMemo(
    () =>
      yearLevelIds.filter((yl) =>
        sets.some((s) => s.program === selectedProgram?.code && s.yearLevel === yl),
      ),
    [sets, selectedProgram, yearLevelIds],
  );

  const availableSets = useMemo(
    () =>
      sets.filter(
        (s) =>
          s.program === selectedProgram?.code &&
          s.yearLevel === selectedYearLevel &&
          !scheduledSetIds.has(s.id),
      ),
    [sets, selectedProgram, selectedYearLevel, scheduledSetIds],
  );

  const displaySchedules = useMemo<Schedule[]>(
    () =>
      slots.map((slot) => ({
        id: slot.tempId,
        schoolYear,
        semester,
        subjectId: String(slot.subjectId),
        subjectCode: slot.subjectCode,
        subjectTitle: slot.subjectTitle,
        setId: String(selectedSet?.id ?? ""),
        setCode: selectedSet?.setCode ?? "",
        program: selectedProgram?.code ?? "",
        departmentCode: selectedProgram?.departmentCode ?? "",
        yearLevel: (selectedYearLevel || 1) as YearLevel,
        facultyId: String(slot.facultyId ?? ""),
        facultyName: slot.facultyName,
        roomId: String(slot.roomId ?? ""),
        roomName: slot.roomName,
        buildingCode: "",
        mode: slot.mode,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    [slots, schoolYear, semester, selectedSet, selectedProgram, selectedYearLevel],
  );

  function handleProgramChange(programId: string) {
    setSelectedProgramId(programId);
    const code = programs?.find((p) => String(p.id) === programId)?.code;
    const newYl = yearLevelIds.find((yl) =>
      sets.some((s) => s.program === code && s.yearLevel === yl),
    );
    setSelectedYearLevel(newYl ?? "");
    setSelectedSetId("");
    setSets([]);
    setSlots([]);
    setHasGenerated(false);
    setGenerationConflicts([]);
  }

  function handleYearLevelChange(yl: YearLevel) {
    setSelectedYearLevel(yl);
    setSelectedSetId("");
    setSlots([]);
    setHasGenerated(false);
    setGenerationConflicts([]);
  }

  async function handleAutoGenerate() {
    if (!selectedSet || !selectedProgram || !selectedYearLevel) return;

    setSaveError(null);
    setGenerationConflicts([]);
    setIsGenerating(true);
    try {
      const { slots: generated, conflicts } = await scheduleService.autoGenerate({
        schoolYear,
        semester,
        semesterLabel: semesterLabel(semester),
        yearLevel: selectedYearLevel,
        yearLevelLabel: yearLevelLabel(selectedYearLevel),
        programId: selectedProgram.id,
        setId: selectedSet.id,
      });
      tempIdCounter.current = 0;
      setSlots(
        generated.map((slot) => {
          tempIdCounter.current += 1;
          return { ...slot, tempId: `tmp-${tempIdCounter.current}` };
        }),
      );
      setGenerationConflicts(conflicts);
      setHasGenerated(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to generate a schedule.");
    } finally {
      setIsGenerating(false);
    }
  }

  function openAddDrawer() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
  }

  function handleSubmitSlot(slot: Omit<PendingSlot, "tempId">) {
    if (editing) {
      setSlots((current) =>
        current.map((s) => (s.tempId === editing.tempId ? { ...slot, tempId: editing.tempId } : s)),
      );
    } else {
      tempIdCounter.current += 1;
      setSlots((current) => [...current, { ...slot, tempId: `tmp-${tempIdCounter.current}` }]);
    }
    closeDrawer();
  }

  function handleEditSlot(schedule: Schedule) {
    const slot = slots.find((s) => s.tempId === schedule.id);
    if (!slot) return;
    setEditing(slot);
    setDrawerOpen(true);
  }

  function handleRemoveSlot(schedule: Schedule) {
    setDeleteTarget(schedule);
  }

  async function confirmRemoveSlot() {
    if (!deleteTarget) return;
    setSlots((current) => current.filter((s) => s.tempId !== deleteTarget.id));
  }

  function handleDuplicateSlot(schedule: Schedule, day: Day) {
    const slot = slots.find((s) => s.tempId === schedule.id);
    if (!slot) return;
    tempIdCounter.current += 1;
    setSlots((current) => [...current, { ...slot, day, tempId: `tmp-${tempIdCounter.current}` }]);
  }

  async function handleSave() {
    if (!selectedSet || !selectedProgram) return;

    setSaveError(null);
    setIsSaving(true);
    try {
      const result = await scheduleService.createRegular({
        schoolYear,
        semester,
        programId: selectedProgram.id,
        setId: selectedSet.id,
        slots: slots.map((s) => ({
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          subjectId: s.subjectId,
          mode: s.mode,
          facultyId: s.facultyId as number,
          facultyName: s.facultyName,
          roomId: s.roomId,
        })),
      });
      if (result.message) toast.success(result.message);
      if (result.warnings?.length) {
        for (const w of result.warnings) toast.warning(w);
      }
      navigate("/schedules/regular-class");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  const contextLocked = slots.length > 0 || isGenerating || isSaving;
  const canGenerateBase = Boolean(selectedSet) && Boolean(selectedYearLevel) && schoolYearValid;
  const canGenerate = canGenerateBase && !isGenerating;
  const canAddSlot = Boolean(selectedSet) && schoolYearValid && subjects.length > 0;
  const lockHint = isGenerating
    ? "Generating schedule…"
    : isSaving
      ? "Saving schedule…"
      : contextLocked
        ? "Remove all slots to change."
        : undefined;
  const isLoading = programs === null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="New Schedule"
        description="Select a set, add time slots for its subjects, then save the whole week at once."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={isSaving || isGenerating}
              onClick={() => navigate("/schedules/regular-class")}
            >
              Cancel
            </Button>
            <Button
              type="button"
              block={false}
              disabled={slots.length === 0 || !selectedSet || isGenerating}
              isLoading={isSaving}
              loadingLabel="Saving…"
              onClick={handleSave}
            >
              Save Schedule{slots.length > 0 ? ` (${slots.length})` : ""}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div
          role="status"
          aria-label="Loading schedule builder"
          className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <AnimatePresence>
            {saveError && (
              <Alert key="save-error" variant="destructive">
                <AlertIcon />
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {generationConflicts.length > 0 && (
              <Alert key="generation-conflicts" variant="warning">
                <AlertTriangleIcon />
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4">
                    {generationConflicts.map((c, i) => (
                      <li key={i}>{highlightSubjectCode(c)}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </AnimatePresence>

          <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
            <FieldChrome
              id="sn-school-year"
              label="School Year"
              labelEnd={
                <button
                  type="button"
                  onClick={() => setAddSchoolYearOpen(true)}
                  disabled={contextLocked}
                  className="font-body text-xs font-medium text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-blue-400"
                >
                  + Add new
                </button>
              }
              hint={lockHint}
            >
              <Select
                items={[
                  {
                    value: "",
                    label: schoolYears.length === 0 ? "No school years yet" : "Select a school year",
                  },
                  ...schoolYears.map((sy) => ({ value: sy.schoolYear, label: sy.schoolYear })),
                ]}
                value={schoolYear}
                onValueChange={(v) => setSchoolYear(v as string)}
                disabled={contextLocked}
              >
                <SelectTrigger id="sn-school-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {schoolYears.length === 0 ? "No school years yet" : "Select a school year"}
                  </SelectItem>
                  {schoolYears.map((sy) => (
                    <SelectItem key={sy.id} value={sy.schoolYear}>
                      {sy.schoolYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="sn-semester" label="Semester">
              <Select
                items={semesters
                  .filter((s) => s.semesterNumber !== 3)
                  .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))}
                value={String(semester)}
                onValueChange={(v) => setSemester(Number(v) as ScheduleSemester)}
                disabled={contextLocked}
              >
                <SelectTrigger id="sn-semester">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {semesters.filter((s) => s.semesterNumber !== 3).map((s) => (
                    <SelectItem key={s.id} value={String(s.semesterNumber)}>
                      {semesterLabel(s.semesterNumber)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="sn-program" label="Program">
              <Select
                items={[
                  { value: "", label: "Select a program" },
                  ...(programs ?? []).map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
                ]}
                value={selectedProgramId}
                onValueChange={(v) => handleProgramChange(v as string)}
                disabled={contextLocked}
              >
                <SelectTrigger id="sn-program">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a program</SelectItem>
                  {(programs ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.code} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="sn-year-level" label="Year Level">
              <Select
                items={[
                  {
                    value: "",
                    label: availableYearLevels.length === 0 ? "Select a program first" : "Select a year level",
                  },
                  ...availableYearLevels.map((yl) => ({ value: String(yl), label: yearLevelLabel(yl) })),
                ]}
                value={String(selectedYearLevel)}
                onValueChange={(v) => handleYearLevelChange(Number(v) as YearLevel)}
                disabled={contextLocked}
              >
                <SelectTrigger id="sn-year-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {availableYearLevels.length === 0 ? "Select a program first" : "Select a year level"}
                  </SelectItem>
                  {availableYearLevels.map((yl) => (
                    <SelectItem key={yl} value={String(yl)}>
                      {yearLevelLabel(yl)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="sn-set" label="Set">
              <Select
                items={[
                  {
                    value: "",
                    label: availableSets.length === 0 ? "Select a year level first" : "Select a set",
                  },
                  ...availableSets.map((s) => ({
                    value: String(s.id),
                    label: `${s.program}-${s.yearLevel}${s.setCode}`,
                  })),
                ]}
                value={selectedSetId}
                onValueChange={(v) => setSelectedSetId(v as string)}
                disabled={contextLocked}
              >
                <SelectTrigger id="sn-set">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {availableSets.length === 0 ? "Select a year level first" : "Select a set"}
                  </SelectItem>
                  {availableSets.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.program}-{s.yearLevel}{s.setCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          </Card>

          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="hidden sm:block" />
            <div className="flex justify-center">
              <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
            </div>
            <div className="flex justify-end gap-2">
              {slots.length > 0 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    disabled={!canGenerate}
                    isLoading={isGenerating}
                    loadingLabel="Regenerating…"
                    onClick={handleAutoGenerate}
                  >
                    <RotateIcon />
                    Regenerate
                  </Button>
                  <Button type="button" block={false} disabled={!canAddSlot || isGenerating || isSaving} onClick={openAddDrawer}>
                    <PlusIcon />
                    Add Slot
                  </Button>
                </>
              )}
            </div>
          </div>



          {slots.length === 0 ? (
            <EmptyState
              title="No slots yet"
              action={
                canGenerateBase ? (
                  <Button
                    type="button"
                    block={false}
                    disabled={!canGenerate}
                    isLoading={isGenerating}
                    loadingLabel={hasGenerated ? "Regenerating…" : "Generating…"}
                    onClick={handleAutoGenerate}
                  >
                    {hasGenerated ? <RotateIcon /> : <ZapIcon />}
                    {hasGenerated ? "Regenerate" : "Auto-Generate"}
                  </Button>
                ) : undefined
              }
            >
              {canGenerateBase
                ? "Auto-generate a schedule for the selected set, then fine-tune the slots."
                : "Pick a school year, semester, program, year level, and set with assigned subjects first."}
            </EmptyState>
          ) : viewMode === "grid" ? (
            <ScheduleGrid
              schedules={displaySchedules}
              onEdit={handleEditSlot}
              onDelete={handleRemoveSlot}
              onDuplicate={handleDuplicateSlot}
            />
          ) : (
            <ScheduleTable
              schedules={displaySchedules}
              onEdit={handleEditSlot}
              onDelete={handleRemoveSlot}
              onDuplicate={handleDuplicateSlot}
            />
          )}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit Slot" : "Add Slot"}
      >
        <SlotEntryForm
          key={editing?.tempId ?? "new"}
          initialSlot={editing ?? undefined}
          subjects={subjects}
          rooms={rooms}
          existingSlots={slots}
          onAdd={handleSubmitSlot}
          onCancelEdit={editing ? closeDrawer : undefined}
        />
      </Drawer>

      <Modal
        open={addSchoolYearOpen}
        onClose={() => setAddSchoolYearOpen(false)}
        title="Add School Year"
      >
        <AddSchoolYearForm
          onAdd={async (newSchoolYear) => {
            const message = await schoolYearService.create(newSchoolYear);
            if (message) toast.success(message);
            await refreshSchoolYears();
            setSchoolYear(newSchoolYear);
            setAddSchoolYearOpen(false);
          }}
          onCancel={() => setAddSchoolYearOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remove slot"
        confirmLabel="Remove"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={confirmRemoveSlot}
      >
        {deleteTarget && (
          <>
            <span className="font-medium text-navy-700 dark:text-white">
              {deleteTarget.subjectCode}
            </span>{" "}
            on {dayLabels[deleteTarget.day]} ({formatTime(deleteTarget.startTime)}–
            {formatTime(deleteTarget.endTime)}) will be removed from this schedule.
          </>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title={isGenerating ? "Cancel schedule generation?" : "Discard unsaved schedule?"}
        confirmLabel={isGenerating ? "Cancel Generation" : "Discard"}
        loadingLabel={isGenerating ? "Cancelling…" : "Discarding…"}
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        {isGenerating
          ? "Schedule generation is in progress. Leaving this page will cancel it."
          : "You have unsaved schedule slots. Leaving this page will discard them."}
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title={isGenerating ? "Cancel schedule generation?" : "Discard unsaved schedule?"}
        confirmLabel={isGenerating ? "Cancel Generation" : "Reload"}
        loadingLabel={isGenerating ? "Cancelling…" : "Reloading…"}
        confirmVariant="danger"
        onConfirm={async () => {
          reloadConfirmed.current = true;
          window.location.reload();
        }}
      >
        {isGenerating
          ? "Schedule generation is in progress. Reloading will cancel it."
          : "You have unsaved schedule slots. Reloading will discard them."}
      </ConfirmDialog>
    </div>
  );
}
