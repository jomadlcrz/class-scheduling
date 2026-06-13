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
import { roomService } from "../../services/room.service";
import { scheduleService } from "../../services/schedule.service";
import { setService } from "../../services/set.service";
import { subjectService } from "../../services/subject.service";
import type { Faculty } from "../../types/faculty";
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
import { YEAR_LEVEL_LABELS } from "../../types/subject";

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
};

function SchedulesNewPage() {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState<PageData | null>(null);

  const [schoolYear, setSchoolYear] = useState(DEFAULT_SCHOOL_YEAR);
  const [semester, setSemester] = useState<ScheduleSemester>(1);
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
    ]).then(([subjects, sets, faculty, rooms]) => {
      setPageData({ subjects, sets, faculty, rooms });
      setSelectedSetId(sets[0]?.id ?? "");
    });
  }, []);

  const selectedSet = pageData?.sets.find((s) => s.id === selectedSetId);

  // Subjects that belong to this set's program + year level.
  const availableSubjects = useMemo(
    () =>
      (pageData?.subjects ?? []).filter(
        (s) =>
          selectedSet &&
          s.program === selectedSet.program &&
          s.yearLevel === selectedSet.yearLevel,
      ),
    [pageData, selectedSet],
  );

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
          {/* Context card — term + set */}
          <div className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

              <Select
                id="ctx-set"
                label="Set"
                value={selectedSetId}
                onChange={(e) => setSelectedSetId(e.target.value)}
                disabled={contextLocked}
                hint={contextLocked ? "Remove all slots to change." : undefined}
              >
                {[...pageData.sets]
                  .sort(
                    (a, b) =>
                      a.program.localeCompare(b.program) ||
                      a.yearLevel - b.yearLevel ||
                      a.setCode.localeCompare(b.setCode),
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.program} {YEAR_LEVEL_LABELS[s.yearLevel as 1]} — Set {s.setCode}
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          <FormError message={saveError} />

          {/* Two-panel: slot entry form + pending slots */}
          <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
            <section className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
              <h2 className="mb-4 font-display text-xl tracking-wide text-navy-700 dark:text-white">
                {editing
                  ? `Edit Slot — ${editing.subjectCode} ${editing.day}`
                  : "Add Time Slot"}
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

            <section className="flex flex-col rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
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
