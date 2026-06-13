import { useState } from "react";
import { FormError } from "../../components/forms/form-error";
import { Button } from "../../components/ui/button";
import { PlusIcon } from "../../components/ui/icons";
import { Select } from "../../components/ui/select";
import type { Faculty } from "../../types/faculty";
import type { Room } from "../../types/room";
import {
  DAYS,
  DAY_LABELS,
  generateTimeSlots,
  formatTime,
  type Day,
} from "../../types/schedule";
import type { Subject } from "../../types/subject";

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
          {isEditing ? "Update Slot" : "Add Slot"}
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
