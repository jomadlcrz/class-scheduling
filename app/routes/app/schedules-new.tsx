import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { ResultState } from "~/components/feedback/result-state";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Drawer } from "~/components/ui/drawer";
import { EmptyState } from "~/components/ui/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "~/features/schedules/schedule-view-toggle";
import { SlotEntryForm, type PendingSlot } from "~/features/schedules/slot-entry-form";
import { PageHeader } from "~/layouts/page-header";
import { programService } from "~/services/program.service";
import {
  scheduleService,
  type ScheduleRoomOption,
  type ScheduleSubjectOption,
} from "~/services/schedule.service";
import { setService } from "~/services/set.service";
import { weeklyHourService } from "~/services/weekly-hour-allocation.service";
import type { Program } from "~/types/program";
import type { LabSlot } from "~/types/weekly-hour-allocation";
import {
  SCHEDULE_SEMESTER_LABELS,
  type Day,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";
import type { ClassSet } from "~/types/set";
import { YEAR_LEVEL_LABELS, YEAR_LEVELS, type YearLevel } from "~/types/subject";

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

// Regular class schedules only cover the two main semesters.
const REGULAR_SEMESTERS: ScheduleSemester[] = [1, 2];

function defaultSchoolYear(): string {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
}

function SchedulesNewPage() {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [sets, setSets] = useState<ClassSet[]>([]);
  const [rooms, setRooms] = useState<ScheduleRoomOption[]>([]);
  const [subjects, setSubjects] = useState<ScheduleSubjectOption[]>([]);

  // The backend requires the opening year to be the current year — typed, not picked.
  const [schoolYear, setSchoolYear] = useState(defaultSchoolYear());
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState<YearLevel | "">("");
  const [selectedSetId, setSelectedSetId] = useState("");

  const [slots, setSlots] = useState<PendingSlot[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [labTimeSlots, setLabTimeSlots] = useState<LabSlot[]>([]);
  const [editing, setEditing] = useState<PendingSlot | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const tempIdCounter = useRef(0);

  useEffect(() => {
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    setService.list().then(setSets).catch(() => setSets([]));
    scheduleService.listScheduleRooms().then(setRooms).catch(() => setRooms([]));
    // Lab sessions are pinned to the slots configured in Weekly Hour Allocations.
    weeklyHourService
      .list()
      .then((allocations) =>
        setLabTimeSlots(
          allocations.find((a) => a.subjectType === "Major with Lab")?.labTimeSlots ?? [],
        ),
      )
      .catch(() => setLabTimeSlots([]));
  }, []);

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
      YEAR_LEVELS.filter((yl) =>
        sets.some((s) => s.program === selectedProgram?.code && s.yearLevel === yl),
      ),
    [sets, selectedProgram],
  );

  const availableSets = useMemo(
    () =>
      sets.filter(
        (s) => s.program === selectedProgram?.code && s.yearLevel === selectedYearLevel,
      ),
    [sets, selectedProgram, selectedYearLevel],
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
    const newYl = YEAR_LEVELS.find((yl) =>
      sets.some((s) => s.program === code && s.yearLevel === yl),
    );
    setSelectedYearLevel(newYl ?? "");
    setSelectedSetId(
      String(sets.find((s) => s.program === code && s.yearLevel === newYl)?.id ?? ""),
    );
    setSlots([]);
    setHasGenerated(false);
  }

  function handleYearLevelChange(yl: YearLevel) {
    setSelectedYearLevel(yl);
    setSelectedSetId(
      String(
        sets.find((s) => s.program === selectedProgram?.code && s.yearLevel === yl)?.id ?? "",
      ),
    );
    setSlots([]);
    setHasGenerated(false);
  }

  async function handleAutoGenerate() {
    if (!selectedSet || !selectedProgram || !selectedYearLevel) return;

    setSaveError(null);
    setIsGenerating(true);
    try {
      const generated = await scheduleService.autoGenerate({
        schoolYear,
        semester,
        yearLevel: selectedYearLevel,
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
    setSlots((current) => current.filter((s) => s.tempId !== schedule.id));
  }

  function handleDuplicateSlot(schedule: Schedule, day: Day) {
    const slot = slots.find((s) => s.tempId === schedule.id);
    if (!slot) return;
    tempIdCounter.current += 1;
    setSlots((current) => [...current, { ...slot, day, tempId: `tmp-${tempIdCounter.current}` }]);
  }

  async function handleSave() {
    if (!selectedSet || !selectedProgram) return;

    const unassigned = slots.filter((s) => s.facultyId === null);
    if (unassigned.length > 0) {
      setSaveError(
        `${unassigned.length} slot${unassigned.length === 1 ? " has" : "s have"} no faculty assigned — edit ${unassigned.length === 1 ? "it" : "them"} before saving.`,
      );
      return;
    }

    setSaveError(null);
    setIsSaving(true);
    try {
      await scheduleService.createRegular({
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
      navigate("/schedules/regular-class");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  const contextLocked = slots.length > 0;
  const canGenerate =
    Boolean(selectedSet) && Boolean(selectedYearLevel) && schoolYearValid && !isGenerating;
  const canAddSlot = Boolean(selectedSet) && schoolYearValid && subjects.length > 0;
  const unassignedCount = slots.filter((s) => s.facultyId === null).length;
  const lockHint = contextLocked ? "Remove all slots to change." : undefined;
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
              onClick={() => navigate("/schedules/regular-class")}
            >
              Cancel
            </Button>
            <Button
              type="button"
              block={false}
              disabled={slots.length === 0 || !selectedSet}
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
          <FormError message={saveError} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Input
              id="sn-school-year"
              label="School Year"
              type="text"
              placeholder="e.g. 2026-2027"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              disabled={contextLocked}
              hint={lockHint}
            />
            <Select
              id="sn-semester"
              label="Semester"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value) as ScheduleSemester)}
              disabled={contextLocked}
            >
              {REGULAR_SEMESTERS.map((s) => (
                <option key={s} value={s}>{SCHEDULE_SEMESTER_LABELS[s]}</option>
              ))}
            </Select>
            <Select
              id="sn-program"
              label="Program"
              value={selectedProgramId}
              onChange={(e) => handleProgramChange(e.target.value)}
              disabled={contextLocked}
            >
              <option value="">Select a program</option>
              {(programs ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </Select>
            <Select
              id="sn-year-level"
              label="Year Level"
              value={selectedYearLevel}
              onChange={(e) => handleYearLevelChange(Number(e.target.value) as YearLevel)}
              disabled={contextLocked}
            >
              {availableYearLevels.length === 0 ? (
                <option value="">No year levels</option>
              ) : (
                availableYearLevels.map((yl) => (
                  <option key={yl} value={yl}>{YEAR_LEVEL_LABELS[yl]}</option>
                ))
              )}
            </Select>
            <Select
              id="sn-set"
              label="Set"
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(e.target.value)}
              disabled={contextLocked}
            >
              {availableSets.length === 0 ? (
                <option value="">No sets</option>
              ) : (
                availableSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.program}-{s.yearLevel}{s.setCode}
                  </option>
                ))
              )}
            </Select>
          </div>

          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="hidden sm:block" />
            <div className="flex justify-center">
              <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                block={false}
                disabled={!canGenerate}
                isLoading={isGenerating}
                loadingLabel="Generating…"
                onClick={handleAutoGenerate}
              >
                <ZapIcon />
                Auto-Generate
              </Button>
              {hasGenerated && (
                <Button type="button" block={false} disabled={!canAddSlot} onClick={openAddDrawer}>
                  <PlusIcon />
                  Add Slot
                </Button>
              )}
            </div>
          </div>

          {unassignedCount > 0 && (
            <ResultState tone="error" title="Slots need attention">
              {unassignedCount} generated slot{unassignedCount === 1 ? "" : "s"} ha
              {unassignedCount === 1 ? "s" : "ve"} no available faculty — edit
              {unassignedCount === 1 ? " it" : " them"} before saving.
            </ResultState>
          )}

          {slots.length === 0 ? (
            <EmptyState title="No slots yet">
              {canGenerate
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
          labTimeSlots={labTimeSlots}
          existingSlots={slots}
          onAdd={handleSubmitSlot}
          onCancelEdit={editing ? closeDrawer : undefined}
        />
      </Drawer>
    </div>
  );
}
