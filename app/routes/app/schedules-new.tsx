import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "../../auth/role-guard";
import { FormError } from "../../components/forms/form-error";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
import { PendingSlots } from "../../features/schedules/pending-slots";
import { SlotEntryForm, type PendingSlot } from "../../features/schedules/slot-entry-form";
import { PageHeader } from "../../layouts/page-header";
import { facultyService } from "../../services/faculty.service";
import { programService } from "../../services/program.service";
import { roomService } from "../../services/room.service";
import { scheduleService } from "../../services/schedule.service";
import { setService } from "../../services/set.service";
import { subjectService } from "../../services/subject.service";
import type { Faculty } from "../../types/faculty";
import type { Program } from "../../types/program";
import type { Room } from "../../types/room";
import {
  DEFAULT_SCHOOL_YEAR,
  SCHEDULE_SEMESTER_LABELS,
  SCHEDULE_SEMESTERS,
  SCHOOL_YEARS,
  type Day,
  type ScheduleSemester,
} from "../../types/schedule";
import type { ClassSet } from "../../types/set";
import type { Subject } from "../../types/subject";
import { YEAR_LEVEL_LABELS, YEAR_LEVELS, type YearLevel } from "../../types/subject";

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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const tempIdCounter = useRef(0);

  useEffect(() => {
    Promise.all([
      subjectService.list(),
      setService.list(),
      facultyService.list(),
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
        (s) => s.program === selectedProgram && s.yearLevel === selectedYearLevel,
      ),
    [pageData, selectedProgram, selectedYearLevel],
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
  }

  function handleYearLevelChange(yl: YearLevel) {
    setSelectedYearLevel(yl);
    setSelectedSetId(
      (pageData?.sets ?? []).find((s) => s.program === selectedProgram && s.yearLevel === yl)?.id ?? "",
    );
  }

  function handleAddSlot(slot: Omit<PendingSlot, "tempId">) {
    if (editing) {
      setSlots((current) =>
        current.map((s) => (s.tempId === editing.tempId ? { ...slot, tempId: editing.tempId } : s)),
      );
      setEditing(null);
    } else {
      tempIdCounter.current += 1;
      setSlots((current) => [...current, { ...slot, tempId: `tmp-${tempIdCounter.current}` }]);
    }
  }

  function handleEditSlot(tempId: string) {
    const slot = slots.find((s) => s.tempId === tempId);
    if (!slot) return;
    setSlots((current) => [
      ...(editing ? [...current, editing] : current).filter((s) => s.tempId !== tempId),
    ]);
    setEditing(slot);
  }

  function handleDuplicateSlot(tempId: string, day: Day) {
    const slot = slots.find((s) => s.tempId === tempId);
    if (!slot) return;
    tempIdCounter.current += 1;
    setSlots((current) => [
      ...current,
      { ...slot, day, tempId: `tmp-${tempIdCounter.current}` },
    ]);
  }

  function handleCancelEdit() {
    if (editing) setSlots((current) => [...current, editing]);
    setEditing(null);
  }

  function handleRemoveSlot(tempId: string) {
    setSlots((current) => current.filter((s) => s.tempId !== tempId));
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
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
        remaining.shift();
      }
      navigate("/schedules");
    } catch (err) {
      setSlots(remaining);
      setSaveError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  const contextLocked = slots.length > 0;

  return (
    <>
      <PageHeader
        title="New Schedule"
        description="Select a set, add time slots for its subjects, then save the whole week at once."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => navigate("/schedules")}
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
        <div className="mt-6 flex flex-col gap-4">
          {/* Context card — term + program + year level + set */}
          <div className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Select
                  id="ctx-school-year"
                  label="School Year"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  disabled={contextLocked}
                  hint={contextLocked ? "Remove all slots to change." : undefined}
                >
                  {SCHOOL_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Select>

                <Select
                  id="ctx-semester"
                  label="Semester"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value) as ScheduleSemester)}
                  disabled={contextLocked}
                  hint={contextLocked ? "Remove all slots to change." : undefined}
                >
                  {SCHEDULE_SEMESTERS.map((s) => (
                    <option key={s} value={s}>{SCHEDULE_SEMESTER_LABELS[s]}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Select
                  id="ctx-program"
                  label="Program"
                  value={selectedProgram}
                  onChange={(e) => handleProgramChange(e.target.value)}
                  disabled={contextLocked}
                  hint={contextLocked ? "Remove all slots to change." : undefined}
                >
                  {pageData.programs.map((p) => (
                    <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
                  ))}
                </Select>

                <Select
                  id="ctx-year-level"
                  label="Year Level"
                  value={selectedYearLevel}
                  onChange={(e) => handleYearLevelChange(Number(e.target.value) as YearLevel)}
                  disabled={contextLocked}
                  hint={contextLocked ? "Remove all slots to change." : undefined}
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
                  id="ctx-set"
                  label="Set"
                  value={selectedSetId}
                  onChange={(e) => setSelectedSetId(e.target.value)}
                  disabled={contextLocked}
                  hint={contextLocked ? "Remove all slots to change." : undefined}
                >
                  {availableSets.length === 0 ? (
                    <option value="">No sets</option>
                  ) : (
                    availableSets
                      .sort((a, b) => a.setCode.localeCompare(b.setCode))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          Set {s.setCode}
                        </option>
                      ))
                  )}
                </Select>
              </div>
            </div>
          </div>

          <FormError message={saveError} />

          {/* Two-panel: slot entry form + pending slots */}
          <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
            <section className="min-w-0 rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
              <h2 className="mb-4 font-display text-xl tracking-wide text-navy-700 dark:text-white">
                {editing
                  ? `Edit Slot — ${editing.subjectCode} ${editing.day}`
                  : "Slot Details"}
              </h2>
              <SlotEntryForm
                key={`${editing?.tempId ?? "new"}-${selectedSetId}`}
                initialSlot={editing ?? undefined}
                subjects={availableSubjects}
                faculty={pageData.faculty}
                rooms={pageData.rooms}
                existingSlots={slots}
                onAdd={handleAddSlot}
                onCancelEdit={handleCancelEdit}
              />
            </section>

            <section className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
              <h2 className="mb-4 shrink-0 font-display text-xl tracking-wide text-navy-700 dark:text-white">
                Week Schedule{slots.length > 0 ? ` — ${slots.length} slot${slots.length > 1 ? "s" : ""}` : ""}
              </h2>
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pr-1">
                <PendingSlots
                  slots={slots}
                  onEdit={handleEditSlot}
                  onDuplicate={handleDuplicateSlot}
                  onRemove={handleRemoveSlot}
                />
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
