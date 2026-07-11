import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/ui/icons";
import { Select } from "~/components/ui/select";
import type { Faculty } from "~/types/faculty";
import type { Room } from "~/types/room";
import {
  DAYS,
  DAY_LABELS,
  SCHEDULE_MODES,
  SCHEDULE_MODE_LABELS,
  generateTimeSlots,
  formatTime,
  getSlotDurationHours,
  type Day,
  type ScheduleMode,
} from "~/types/schedule";
import type { Subject } from "~/types/subject";

export type PendingSlot = {
  tempId: string;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  day: Day;
  startTime: string;
  endTime: string;
  facultyId: string;
  facultyName: string;
  roomId: string;
  roomName: string;
  buildingCode: string;
  mode: ScheduleMode;
};

type SlotEntryFormProps = {
  initialSlot?: PendingSlot;
  subjects: Subject[];
  faculty: Faculty[];
  rooms: Room[];
  existingSlots: PendingSlot[];
  onAdd: (slot: Omit<PendingSlot, "tempId">) => void;
  onCancelEdit?: () => void;
};

const TIME_SLOTS = generateTimeSlots();

export function SlotEntryForm({
  initialSlot,
  subjects,
  faculty,
  rooms,
  existingSlots,
  onAdd,
  onCancelEdit,
}: SlotEntryFormProps) {
  const [error, setError] = useState<string | null>(null);

  const defaultSubject = initialSlot
    ? subjects.find((s) => s.id === initialSlot.subjectId) ?? subjects[0]
    : subjects[0];

  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultSubject?.id ?? "");
  const [day, setDay] = useState<Day>(initialSlot?.day ?? "M");
  const [startTime, setStartTime] = useState(initialSlot?.startTime ?? "07:00");
  const [endTime, setEndTime] = useState(initialSlot?.endTime ?? "10:00");
  const [facultyId, setFacultyId] = useState(
    initialSlot?.facultyId ?? faculty.find((f) => f.status === "active")?.id ?? "",
  );
  const [roomId, setRoomId] = useState(initialSlot?.roomId ?? rooms[0]?.id ?? "");
  const [mode, setMode] = useState<ScheduleMode>(initialSlot?.mode ?? "F2F");

  const isEditing = Boolean(initialSlot);
  const activeFaculty = faculty.filter((f) => f.status === "active");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    const subject = subjects.find((s) => s.id === selectedSubjectId);
    const member = faculty.find((f) => f.id === facultyId);
    const room = rooms.find((r) => r.id === roomId);

    if (!subject) { setError("Select a subject."); return; }
    if (!member) { setError("Select a faculty member."); return; }
    if (!room) { setError("Select a room."); return; }

    const conflict = existingSlots.find(
      (s) =>
        s.tempId !== initialSlot?.tempId &&
        s.day === day &&
        s.startTime < endTime &&
        s.endTime > startTime,
    );
    if (conflict) {
      setError(`A slot already exists on ${DAY_LABELS[day]} at that time.`);
      return;
    }

    try {
      onAdd({
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectTitle: subject.title,
        day,
        startTime,
        endTime,
        facultyId,
        facultyName: `${member.firstName} ${member.lastName}`,
        roomId,
        roomName: room.name,
        buildingCode: room.buildingCode,
        mode,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the slot.");
      return;
    }

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
        onChange={(e) => setSelectedSubjectId(e.target.value)}
      >
        {subjects.length === 0 ? (
          <option value="">No subjects for this set</option>
        ) : (
          [...subjects]
            .sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code))
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
          <option key={d} value={d}>{DAY_LABELS[d]}</option>
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
          {TIME_SLOTS.slice(1).map((t) => (
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
        {SCHEDULE_MODES.map((m) => (
          <option key={m} value={m}>{SCHEDULE_MODE_LABELS[m]}</option>
        ))}
      </Select>

      <Select
        id="slot-faculty"
        label="Faculty"
        value={facultyId}
        onChange={(e) => setFacultyId(e.target.value)}
      >
        {activeFaculty.map((f) => (
          <option key={f.id} value={f.id}>
            {f.lastName}, {f.firstName} ({f.departmentCode})
          </option>
        ))}
      </Select>

      {facultyId && (
        <InstructorLoad
          facultyId={facultyId}
          existingSlots={existingSlots}
          startTime={startTime}
          endTime={endTime}
          facultyList={faculty}
        />
      )}

      <Select
        id="slot-room"
        label="Room"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      >
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.buildingCode} — {r.name} (cap. {r.capacity})
          </option>
        ))}
      </Select>

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
  facultyId,
  existingSlots,
  startTime,
  endTime,
  facultyList,
}: {
  facultyId: string;
  existingSlots: PendingSlot[];
  startTime: string;
  endTime: string;
  facultyList: Faculty[];
}) {
  const faculty = facultyList.find((f) => f.id === facultyId);
  const maxHours = faculty?.maxWeeklyHours;
  if (!faculty || !maxHours || maxHours <= 0) return null;

  const currentHours = existingSlots
    .filter((s) => s.facultyId === facultyId)
    .reduce((sum, s) => sum + getSlotDurationHours(s.startTime, s.endTime), 0);

  const proposedHours =
    startTime && endTime ? getSlotDurationHours(startTime, endTime) : 0;

  const newTotal = currentHours + proposedHours;
  const percent = Math.min(
    Math.round((newTotal / maxHours) * 100),
    100,
  );
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
          {proposedHours > 0 ? ` + ${proposedHours}` : ""} /{" "}
          {faculty.maxWeeklyHours} hrs
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-200 ${
            isOver
              ? "bg-red-500"
              : percent >= 80
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
