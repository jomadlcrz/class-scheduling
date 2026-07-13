import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/ui/icons";
import { Select } from "~/components/ui/select";
import type {
  ScheduleFacultyOption,
  ScheduleRoomOption,
  ScheduleSubjectOption,
  SlotDraft,
} from "~/services/schedule.service";
import {
  DAYS,
  generateTimeSlots,
  formatTime,
  getSlotDurationHours,
  timeToMinutes,
  type Day,
  type ScheduleMode,
} from "~/types/schedule";
import { useClassModes } from "~/hooks/use-class-modes";
import { useDays } from "~/hooks/use-days";

export type PendingSlot = SlotDraft & { tempId: string };

/**
 * The subject's usual faculty list (/schedule/subjects) only shows instructors
 * assigned under this exact program's curriculum. Auto-generate can assign someone
 * from a different program's curriculum for the same subject instead — that
 * instructor won't be in `base`, so the dropdown would silently show nothing
 * selected. Fill in whoever the slot actually has (via its own faculty_choices,
 * or the assignment itself) as extra options so editing always resolves correctly.
 */
function mergeFaculties(
  base: ScheduleFacultyOption[],
  slot: PendingSlot | undefined,
): ScheduleFacultyOption[] {
  if (!slot) return base;

  const candidates = [...(slot.facultyChoices ?? [])];
  if (slot.facultyId != null && !candidates.some((f) => f.id === slot.facultyId)) {
    candidates.push({ id: slot.facultyId, fullName: slot.facultyName });
  }

  const missing = candidates
    .filter((f) => !base.some((b) => b.id === f.id))
    .map((f) => ({ id: f.id, fullName: f.fullName, maxWeeklyHours: null, currentWeeklyHours: null }));

  return [...base, ...missing];
}

/**
 * Auto-generate already resolves each slot to a room of the correct type (lecture
 * vs lab) via its own room_choices — but /schedule/rooms has no type info at all,
 * so nothing stops reassigning a Lab session to a lecture room unless the dropdown
 * is narrowed to what the algorithm actually vetted for this exact slot.
 */
function mergeRooms(base: ScheduleRoomOption[], slot: PendingSlot | undefined): ScheduleRoomOption[] {
  if (!slot || !slot.roomChoices || slot.roomChoices.length === 0) return base;

  const candidates = [...slot.roomChoices];
  if (slot.roomId != null && !candidates.some((r) => r.id === slot.roomId)) {
    candidates.push({ id: slot.roomId, roomName: slot.roomName });
  }

  return candidates.map((c) => {
    const match = base.find((b) => b.id === c.id);
    return match ?? { id: c.id, buildingName: "", floorLevel: 0, roomName: c.roomName, roomCapacity: 0 };
  });
}

type SlotEntryFormProps = {
  initialSlot?: PendingSlot;
  /** Curriculum subjects for the chosen term, each with its assigned faculties. */
  subjects: ScheduleSubjectOption[];
  rooms: ScheduleRoomOption[];
  existingSlots: PendingSlot[];
  onAdd: (slot: Omit<PendingSlot, "tempId">) => void;
  onCancelEdit?: () => void;
};

const TIME_SLOTS = generateTimeSlots();

export function SlotEntryForm({
  initialSlot,
  subjects,
  rooms,
  existingSlots,
  onAdd,
  onCancelEdit,
}: SlotEntryFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { classModes } = useClassModes();
  const { dayLabels } = useDays();

  const [selectedSubjectId, setSelectedSubjectId] = useState(
    String(initialSlot?.subjectId ?? subjects[0]?.id ?? ""),
  );
  const [day, setDay] = useState<Day>(initialSlot?.day ?? "M");
  const [startTime, setStartTime] = useState(initialSlot?.startTime ?? "07:00");
  const [endTime, setEndTime] = useState(initialSlot?.endTime ?? "10:00");
  const [facultyId, setFacultyId] = useState(String(initialSlot?.facultyId ?? ""));
  const [roomId, setRoomId] = useState(String(initialSlot?.roomId ?? rooms[0]?.id ?? ""));
  const [mode, setMode] = useState<ScheduleMode>(initialSlot?.mode ?? "F2F");

  const isEditing = Boolean(initialSlot);
  const selectedSubject = subjects.find((s) => String(s.id) === selectedSubjectId);
  const isOriginalSubject = isEditing && selectedSubjectId === String(initialSlot?.subjectId ?? "");
  const faculties = mergeFaculties(
    selectedSubject?.faculties ?? [],
    isOriginalSubject ? initialSlot : undefined,
  );
  const selectedFaculty = faculties.find((f) => String(f.id) === facultyId);
  const roomOptions = mergeRooms(rooms, isOriginalSubject ? initialSlot : undefined);
  const needsRoom = mode === "F2F";
  function handleSubjectChange(id: string) {
    setSelectedSubjectId(id);
    // Faculties are per subject — reset to the subject's first option.
    const subject = subjects.find((s) => String(s.id) === id);
    setFacultyId(String(subject?.faculties[0]?.id ?? ""));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    const room = roomOptions.find((r) => String(r.id) === roomId);

    if (!selectedSubject) { setError("Select a subject."); return; }
    if (!selectedFaculty) { setError("Select a faculty member."); return; }
    if (needsRoom && !room) { setError("Select a room."); return; }

    const conflict = existingSlots.find(
      (s) =>
        s.tempId !== initialSlot?.tempId &&
        s.day === day &&
        s.startTime < endTime &&
        s.endTime > startTime,
    );
    if (conflict) {
      setError(`A slot already exists on ${dayLabels[day]} at that time.`);
      return;
    }

    onAdd({
      subjectId: selectedSubject.id,
      subjectCode: selectedSubject.code,
      subjectTitle: selectedSubject.title,
      day,
      startTime,
      endTime,
      facultyId: selectedFaculty.id,
      facultyName: selectedFaculty.fullName,
      roomId: needsRoom && room ? room.id : null,
      roomName: needsRoom && room ? room.roomName : "",
      mode,
      sessionType: initialSlot?.sessionType,
    });

    setError(null);
    if (!isEditing) {
      setDay("M");
      setStartTime("07:00");
      setEndTime("10:00");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <Select
        id="slot-subject"
        label="Subject"
        value={selectedSubjectId}
        onChange={(e) => handleSubjectChange(e.target.value)}
      >
        {subjects.length === 0 ? (
          <option value="">No subjects for this set</option>
        ) : (
          [...subjects]
            .sort((a, b) => a.code.localeCompare(b.code))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.title}
              </option>
            ))
        )}
      </Select>

      <Select
        id="slot-day"
        label="Day"
        value={day}
        onChange={(e) => setDay(e.target.value as Day)}
      >
        {DAYS.map((d) => (
          <option key={d} value={d}>{dayLabels[d]}</option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="slot-start"
          label="Start Time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        >
          {TIME_SLOTS.slice(0, -1).map((t) => (
            <option key={t} value={t}>{formatTime(t)}</option>
          ))}
        </Select>
        <Select
          id="slot-end"
          label="End Time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        >
          {TIME_SLOTS.filter((t) => timeToMinutes(t) > timeToMinutes(startTime)).map((t) => (
            <option key={t} value={t}>{formatTime(t)}</option>
          ))}
        </Select>
      </div>

      <Select
        id="slot-mode"
        label="Mode"
        value={mode}
        onChange={(e) => setMode(e.target.value as ScheduleMode)}
      >
        {classModes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </Select>

      <Select
        id="slot-faculty"
        label="Faculty"
        value={facultyId}
        onChange={(e) => setFacultyId(e.target.value)}
      >
        {faculties.length === 0 ? (
          <option value="">No faculty assigned to this subject</option>
        ) : (
          faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.fullName}</option>
          ))
        )}
      </Select>

      {selectedFaculty && (
        <InstructorLoad
          faculty={selectedFaculty}
          existingSlots={existingSlots}
          startTime={startTime}
          endTime={endTime}
        />
      )}

      {needsRoom && (
        <Select
          id="slot-room"
          label="Room"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        >
          {roomOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.buildingName ? `${r.buildingName} — ${r.roomName} (cap. ${r.roomCapacity})` : r.roomName}
            </option>
          ))}
        </Select>
      )}

      <div className="flex flex-col gap-2">
        <Button>
          <PlusIcon />
          {isEditing ? "Update Slot" : "Add to Schedule"}
        </Button>
        {isEditing && onCancelEdit && (
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel Edit
          </Button>
        )}
      </div>
    </form>
  );
}

function InstructorLoad({
  faculty,
  existingSlots,
  startTime,
  endTime,
}: {
  faculty: { id: number; fullName: string; maxWeeklyHours: number | null; currentWeeklyHours: number | null };
  existingSlots: PendingSlot[];
  startTime: string;
  endTime: string;
}) {
  const maxHours = faculty.maxWeeklyHours;
  if (!maxHours || maxHours <= 0) return null;

  const currentHours =
    (faculty.currentWeeklyHours ?? 0) +
    existingSlots
      .filter((s) => s.facultyId === faculty.id)
      .reduce((sum, s) => sum + getSlotDurationHours(s.startTime, s.endTime), 0);

  const proposedHours =
    startTime && endTime && startTime < endTime ? getSlotDurationHours(startTime, endTime) : 0;

  const newTotal = currentHours + proposedHours;
  const percent = Math.min(Math.round((newTotal / maxHours) * 100), 100);
  const isOver = newTotal > maxHours;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-2 font-body text-xs">
        <span className="font-semibold text-slate-500 dark:text-slate-400">
          Weekly teaching load
        </span>
        <span
          className={
            isOver
              ? "font-semibold text-red-600 dark:text-red-400"
              : "text-slate-500 dark:text-slate-400"
          }
        >
          {currentHours}
          {proposedHours > 0 ? ` + ${proposedHours}` : ""} / {maxHours} hrs
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-200 ${
            isOver ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
