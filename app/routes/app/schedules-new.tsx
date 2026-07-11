import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Drawer } from "~/components/ui/drawer";
import { EmptyState } from "~/components/ui/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "~/features/schedules/schedule-view-toggle";
import { SlotEntryForm, type PendingSlot } from "~/features/schedules/slot-entry-form";
import { getHoursForSubjectType } from "~/lib/weekly-hours";
import { PageHeader } from "~/layouts/page-header";
import { programService } from "~/services/program.service";
import { roomService } from "~/services/room.service";
import { scheduleService } from "~/services/schedule.service";
import { setService } from "~/services/set.service";
import { subjectService } from "~/services/subject.service";
import type { Faculty } from "~/types/faculty";
import type { Program } from "~/types/program";
import type { Room } from "~/types/room";
import {
  DEFAULT_SCHOOL_YEAR,
  SCHEDULE_SEMESTER_LABELS,
  SCHEDULE_SEMESTERS,
  SCHOOL_YEARS,
  getSlotDurationHours,
  type Day,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";
import type { ClassSet } from "~/types/set";
import type { Subject } from "~/types/subject";
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

type PageData = {
  subjects: Subject[];
  sets: ClassSet[];
  faculty: Faculty[];
  rooms: Room[];
  programs: Program[];
};

const DAY_ORDER: Day[] = ["M", "T", "W", "Th", "F"];
const TIME_BLOCKS = [
  { start: "07:00", end: "10:00" },
  { start: "10:00", end: "13:00" },
  { start: "13:00", end: "16:00" },
  { start: "16:00", end: "19:00" },
];

function SchedulesNewPage() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState<PageData | null>(null);

  const [schoolYear, setSchoolYear] = useState(DEFAULT_SCHOOL_YEAR);
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState<YearLevel | "">("");
  const [selectedSetId, setSelectedSetId] = useState("");

  const [slots, setSlots] = useState<PendingSlot[]>([]);
  const [editing, setEditing] = useState<PendingSlot | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const tempIdCounter = useRef(0);

  useEffect(() => {
    Promise.all([
      subjectService.list(),
      setService.list(),
      Promise.resolve([] as Faculty[]),
      roomService.list(),
      programService.list(),
    ]).then(([subjects, sets, faculty, rooms, programs]) => {
      setPageData({ subjects, sets, faculty, rooms, programs });

      const firstProgram = programs[0]?.code ?? "";
      const firstYl =
        YEAR_LEVELS.find((yl) => sets.some((s) => s.program === firstProgram && s.yearLevel === yl)) ??
        (1 as YearLevel);
      const firstSet = sets.find((s) => s.program === firstProgram && s.yearLevel === firstYl);

      setSelectedProgram(firstProgram);
      setSelectedYearLevel(firstYl);
      setSelectedSetId(firstSet?.id ?? "");
    });
  }, []);

  const selectedSet = pageData?.sets.find((s) => s.id === selectedSetId);

  const availableYearLevels = useMemo(
    () =>
      YEAR_LEVELS.filter((yl) =>
        (pageData?.sets ?? []).some((s) => s.program === selectedProgram && s.yearLevel === yl),
      ),
    [pageData, selectedProgram],
  );

  const availableSets = useMemo(
    () =>
      (pageData?.sets ?? []).filter(
        (s) => s.program === selectedProgram && s.yearLevel === selectedYearLevel,
      ),
    [pageData, selectedProgram, selectedYearLevel],
  );

  const availableSubjects = useMemo(
    () =>
      (pageData?.subjects ?? []).filter(
        (s) => s.program === selectedProgram && s.yearLevel === selectedYearLevel && s.semester === semester,
      ),
    [pageData, selectedProgram, selectedYearLevel, semester],
  );

  const displaySchedules = useMemo<Schedule[]>(
    () =>
      slots.map((slot) => ({
        id: slot.tempId,
        schoolYear,
        semester,
        subjectId: slot.subjectId,
        subjectCode: slot.subjectCode,
        subjectTitle: slot.subjectTitle,
        setId: selectedSet?.id ?? "",
        setCode: selectedSet?.setCode ?? "",
        program: selectedSet?.program ?? selectedProgram,
        yearLevel: selectedSet?.yearLevel ?? ((selectedYearLevel || 1) as YearLevel),
        facultyId: slot.facultyId,
        facultyName: slot.facultyName,
        roomId: slot.roomId,
        roomName: slot.roomName,
        buildingCode: slot.buildingCode,
        mode: slot.mode,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    [slots, schoolYear, semester, selectedSet, selectedProgram, selectedYearLevel],
  );

  function handleProgramChange(program: string) {
    setSelectedProgram(program);
    const newYl =
      YEAR_LEVELS.find((yl) =>
        (pageData?.sets ?? []).some((s) => s.program === program && s.yearLevel === yl),
      ) ?? (1 as YearLevel);
    setSelectedYearLevel(newYl);
    setSelectedSetId(
      (pageData?.sets ?? []).find((s) => s.program === program && s.yearLevel === newYl)?.id ?? "",
    );
    setSlots([]);
  }

  function handleYearLevelChange(yl: YearLevel) {
    setSelectedYearLevel(yl);
    setSelectedSetId(
      (pageData?.sets ?? []).find((s) => s.program === selectedProgram && s.yearLevel === yl)?.id ?? "",
    );
    setSlots([]);
  }

  function handleAutoGenerate() {
    if (!pageData || !selectedSet) return;

    const programSubjects = availableSubjects;
    const activeFaculty = pageData.faculty.filter((f) => f.status === "active");
    if (programSubjects.length === 0 || activeFaculty.length === 0 || pageData.rooms.length === 0) return;

    setAutoGenerating(true);

    // Small delay so the spinner renders
    setTimeout(() => {
      const sortedSubjects = [...programSubjects].sort(
        (a, b) => a.code.localeCompare(b.code),
      );

      // Grid of available slots: iterate day x timeBlock
      const gridSlots: Array<{ day: Day; startTime: string; endTime: string }> = [];
      for (const day of DAY_ORDER) {
        for (const block of TIME_BLOCKS) {
          gridSlots.push({ day, startTime: block.start, endTime: block.end });
        }
      }

      const newSlots: Omit<PendingSlot, "tempId">[] = [];
      let cursor = 0;

      for (const subject of sortedSubjects) {
        const h = getHoursForSubjectType(subject.subjectType);
        const totalHours = h.lectureHours + h.labHours;
        const numSlots = Math.max(1, Math.ceil(totalHours / 3));

        for (let i = 0; i < numSlots && cursor < gridSlots.length; i++) {
          const slot = gridSlots[cursor];
          cursor++;

          const facultyMember = activeFaculty[newSlots.length % activeFaculty.length];
          const room = pageData.rooms[newSlots.length % pageData.rooms.length];

          newSlots.push({
            subjectId: subject.id,
            subjectCode: subject.code,
            subjectTitle: subject.title,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            facultyId: facultyMember.id,
            facultyName: `${facultyMember.firstName} ${facultyMember.lastName}`,
            roomId: room.id,
            roomName: room.name,
            buildingCode: room.buildingCode,
            mode: "F2F" as const,
          });
        }
      }

      tempIdCounter.current = 0;
      const slotsWithIds: PendingSlot[] = newSlots.map((slot) => {
        tempIdCounter.current += 1;
        return { ...slot, tempId: `tmp-${tempIdCounter.current}` };
      });

      setSlots(slotsWithIds);
      setAutoGenerating(false);
    }, 200);
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
    setSlots((current) => [
      ...current,
      { ...slot, day, tempId: `tmp-${tempIdCounter.current}` },
    ]);
  }

  async function handleSave() {
    if (!selectedSet) return;

    setSaveError(null);
    setIsSaving(true);
    const remaining = [...slots];
    try {
      for (const slot of slots) {
        await scheduleService.create({
          schoolYear,
          semester,
          subjectId: slot.subjectId,
          subjectCode: slot.subjectCode,
          subjectTitle: slot.subjectTitle,
          setId: selectedSet.id,
          setCode: selectedSet.setCode,
          program: selectedSet.program,
          yearLevel: selectedSet.yearLevel,
          facultyId: slot.facultyId,
          facultyName: slot.facultyName,
          roomId: slot.roomId,
          roomName: slot.roomName,
          buildingCode: slot.buildingCode,
          mode: slot.mode,
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
        remaining.shift();
      }
      navigate("/schedules/regular-class");
    } catch (err) {
      setSlots(remaining);
      setSaveError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  const contextLocked = slots.length > 0;
  const canAddSlot = Boolean(selectedSet) && availableSubjects.length > 0;
  const canAutoGenerate = Boolean(selectedSet) && availableSubjects.length > 0;
  const lockHint = contextLocked ? "Remove all slots to change." : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="New Schedule"
        description="Select a set, auto-generate or add time slots for its subjects, then save the whole week at once."
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

      {pageData === null ? (
        <div
          role="status"
          aria-label="Loading"
          className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {/* Context filter row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Select
              id="ctx-school-year"
              label="School Year"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              disabled={contextLocked}
              hint={lockHint}
            >
              {SCHOOL_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
            <Select
              id="ctx-year-level"
              label="Year Level"
              value={selectedYearLevel}
              onChange={(e) => handleYearLevelChange(Number(e.target.value) as YearLevel)}
              disabled={contextLocked}
              hint={lockHint}
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
              id="ctx-semester"
              label="Semester"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value) as ScheduleSemester)}
              disabled={contextLocked}
              hint={lockHint}
            >
              {SCHEDULE_SEMESTERS.map((s) => (
                <option key={s} value={s}>{SCHEDULE_SEMESTER_LABELS[s]}</option>
              ))}
            </Select>
            <Select
              id="ctx-program"
              label="Program"
              value={selectedProgram}
              onChange={(e) => handleProgramChange(e.target.value)}
              disabled={contextLocked}
              hint={lockHint}
            >
              {pageData.programs.map((p) => (
                <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
              ))}
            </Select>
            <Select
              id="ctx-set"
              label="Set"
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(e.target.value)}
              disabled={contextLocked}
              hint={lockHint}
            >
              {availableSets.length === 0 ? (
                <option value="">No sets</option>
              ) : (
                [...availableSets]
                  .sort((a, b) => a.setCode.localeCompare(b.setCode))
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.program}-{s.yearLevel}{s.setCode}</option>
                  ))
              )}
            </Select>
          </div>

          <FormError message={saveError} />

          {/* Toolbar: view toggle + action buttons */}
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="hidden sm:block" />
            <div className="flex justify-center">
              <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
            </div>
            <div className="flex justify-end gap-2">
              {slots.length > 0 && (
                <Button type="button" block={false} disabled={!canAddSlot} onClick={openAddDrawer}>
                  <PlusIcon />
                  Add Slot
                </Button>
              )}
              <Button
                type="button"
                variant={slots.length === 0 ? "primary" : "outline"}
                block={false}
                disabled={!canAutoGenerate || autoGenerating}
                isLoading={autoGenerating}
                loadingLabel="Generating…"
                onClick={handleAutoGenerate}
              >
                <ZapIcon />
                {slots.length === 0 ? "Auto Generate" : "Regenerate"}
              </Button>
            </div>
          </div>

          {/* Faculty load summary */}
          {slots.length > 0 && (
            <section aria-labelledby="faculty-load-heading">
              <h3
                id="faculty-load-heading"
                className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Faculty Load
              </h3>
              <div className="flex flex-wrap gap-3">
                {(() => {
                  const loadMap = new Map<string, { name: string; hours: number }>();
                  for (const slot of slots) {
                    const key = slot.facultyId;
                    const existing = loadMap.get(key) ?? { name: slot.facultyName, hours: 0 };
                    existing.hours += getSlotDurationHours(slot.startTime, slot.endTime);
                    loadMap.set(key, existing);
                  }
                  const maxHours = Math.max(...[...loadMap.values()].map((l) => l.hours), 1);
                  return [...loadMap.entries()].map(([id, load]) => (
                    <div
                      key={id}
                      className="min-w-44 flex-1 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <p className="truncate font-body text-sm font-medium text-navy-700 dark:text-white">
                        {load.name}
                      </p>
                      <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                        {load.hours.toFixed(1)} hrs/week
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div
                          className="h-1.5 rounded-full bg-navy-700 dark:bg-gold-400"
                          style={{ width: `${(load.hours / maxHours) * 100}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </section>
          )}

          {/* Week schedule body */}
          {slots.length === 0 ? (
            <EmptyState title={autoGenerating ? "Generating schedule…" : "No slots yet"}>
              {autoGenerating
                ? "Please wait while slots are created."
                : availableSubjects.length === 0
                  ? "No subjects available for this program, year level, and semester."
                  : "Use “Auto Generate” to create slots for all subjects, or switch to the grid view and add slots manually."}
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
        description={
          selectedSet
            ? `${selectedSet.program}-${selectedSet.yearLevel}${selectedSet.setCode} · ${SCHEDULE_SEMESTER_LABELS[semester]}`
            : undefined
        }
      >
        {pageData && (
          <SlotEntryForm
            key={editing?.tempId ?? "new"}
            initialSlot={editing ?? undefined}
            subjects={availableSubjects}
            faculty={pageData.faculty}
            rooms={pageData.rooms}
            existingSlots={slots}
            onAdd={handleSubmitSlot}
            onCancelEdit={closeDrawer}
          />
        )}
      </Drawer>
    </div>
  );
}
