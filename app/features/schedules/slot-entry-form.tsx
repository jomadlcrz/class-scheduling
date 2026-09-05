import { useEffect, useMemo, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "~/components/ui/combobox";
import { PlusIcon } from "~/components/ui/icons";
import { FieldChrome, inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
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
import { useSessionModes } from "~/hooks/use-session-modes";

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
  /** Pre-fill fields from a conflict alert (not the same as editing an existing slot). */
  conflictPrefill?: {
    subjectCode: string;
    day: Day;
    startTime: string;
    endTime: string;
    roomName: string;
    facultyName?: string;
  };
  /** True when opening from a conflict suggestion (moving an existing slot). */
  isConflictMove?: boolean;
  savedSessionEdit?: boolean;
};

const TIME_SLOTS = generateTimeSlots();

export function SlotEntryForm({
  initialSlot,
  subjects,
  rooms,
  existingSlots,
  onAdd,
  onCancelEdit,
  conflictPrefill,
  isConflictMove,
  savedSessionEdit = false,
}: SlotEntryFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { classModes } = useClassModes();
  const { sessionModes } = useSessionModes();
  const { dayLabels } = useDays();

  const defaultSubjectId = conflictPrefill
    ? String(subjects.find((s) => s.code === conflictPrefill.subjectCode)?.id ?? "")
    : String(initialSlot?.subjectId ?? "");
  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultSubjectId);
  const [day, setDay] = useState<Day>(conflictPrefill?.day ?? initialSlot?.day ?? "M");
  const [startTime, setStartTime] = useState(conflictPrefill?.startTime ?? initialSlot?.startTime ?? "07:00");
  const [endTime, setEndTime] = useState(conflictPrefill?.endTime ?? initialSlot?.endTime ?? "10:00");

  // For conflict pre-fill: resolve the faculty ID from the name looked up in saved schedules.
  const conflictFaculty = conflictPrefill?.facultyName
    ? subjects.find((s) => s.code === conflictPrefill.subjectCode)
        ?.faculties.find((f) => f.fullName === conflictPrefill.facultyName)
    : undefined;
  const [facultyId, setFacultyId] = useState(String(initialSlot?.facultyId ?? conflictFaculty?.id ?? ""));
  const [facultyQuery, setFacultyQuery] = useState(initialSlot?.facultyName ?? conflictPrefill?.facultyName ?? "");
  const defaultRoomId = conflictPrefill
    ? String(rooms.find((r) => r.roomName === conflictPrefill.roomName)?.id ?? "")
    : String(initialSlot?.roomId ?? "");
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [mode, setMode] = useState<ScheduleMode>(initialSlot?.mode ?? "");
  const [sessionMode, setSessionMode] = useState(initialSlot?.sessionMode ?? "");

  // An existing generated slot can outlive the current subject query after a
  // curriculum change. Keep its label available instead of showing its ID.
  const availableSubjects = useMemo(() => {
    if (!initialSlot || subjects.some((subject) => subject.id === initialSlot.subjectId)) return subjects;
    return [...subjects, {
      id: initialSlot.subjectId,
      code: initialSlot.subjectCode,
      title: initialSlot.subjectTitle,
      subjectType: "",
      faculties: initialSlot.facultyChoices?.map((faculty) => ({
        id: faculty.id,
        fullName: faculty.fullName,
        maxWeeklyHours: null,
        currentWeeklyHours: null,
      })) ?? (initialSlot.facultyId != null
        ? [{ id: initialSlot.facultyId, fullName: initialSlot.facultyName, maxWeeklyHours: null, currentWeeklyHours: null }]
        : []),
    }];
  }, [initialSlot, subjects]);

  // The backend owns the allowed delivery-mode vocabulary. New manual slots
  // adopt its first option once /enums has loaded instead of assuming F2F.
  useEffect(() => {
    if (!mode && classModes[0]) setMode(classModes[0] as ScheduleMode);
  }, [classModes, mode]);

  useEffect(() => {
    if (!sessionMode && sessionModes[0]) setSessionMode(sessionModes[0]);
  }, [sessionMode, sessionModes]);

  const isEditing = Boolean(initialSlot);
  const selectedSubject = availableSubjects.find((s) => String(s.id) === selectedSubjectId);
  const isMajorWithLab = selectedSubject?.subjectType === "Major with Lab";
  const isOriginalSubject = isEditing && selectedSubjectId === String(initialSlot?.subjectId ?? "");
  const faculties = mergeFaculties(
    selectedSubject?.faculties ?? [],
    isOriginalSubject ? initialSlot : undefined,
  );
  const selectedFaculty = faculties.find((f) => String(f.id) === facultyId);
  const filteredFaculties = faculties.filter((f) =>
    f.fullName.toLowerCase().includes(facultyQuery.trim().toLowerCase()),
  );
  const roomOptions = mergeRooms(rooms, isOriginalSubject ? initialSlot : undefined);
  const needsRoom = mode === "F2F";

  function handleSubjectChange(id: string) {
    setSelectedSubjectId(id);
    // Faculties are per subject — reset to the subject's first option.
    const subject = availableSubjects.find((s) => String(s.id) === id);
    const firstFaculty = subject?.faculties[0];
    setFacultyId(String(firstFaculty?.id ?? ""));
    setFacultyQuery(firstFaculty?.fullName ?? "");
    setError(null);
  }

  useEffect(() => {
    if (!isMajorWithLab && sessionMode !== "LEC") setSessionMode("LEC");
  }, [isMajorWithLab, sessionMode]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    const room = roomOptions.find((r) => String(r.id) === roomId);

    if (!selectedSubject) { setError("Select a subject."); return; }
    if (!mode) { setError("Class modes are still loading. Please try again shortly."); return; }
    if (!sessionMode) { setError("Session modes are still loading. Please try again shortly."); return; }
    if (!selectedFaculty) { setError("Select a faculty member."); return; }
    if (needsRoom && !room) { setError("Select a room."); return; }

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
      sessionMode,
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

      <FieldChrome id="slot-subject" label="Subject">
        <Select
          items={
            availableSubjects.length === 0
              ? [{ value: "", label: "No subjects for this set" }]
              : [...availableSubjects]
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map((s) => ({ value: String(s.id), label: `${s.code} — ${s.title}` }))
          }
          value={selectedSubjectId}
          onValueChange={(v) => handleSubjectChange(v as string)}
        >
          <SelectTrigger id="slot-subject">
            <SelectValue placeholder="Select a subject…">
              {selectedSubject ? `${selectedSubject.code} — ${selectedSubject.title}` : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableSubjects.length === 0 ? (
              <SelectItem value="">No subjects for this set</SelectItem>
            ) : (
              [...availableSubjects]
                .sort((a, b) => a.code.localeCompare(b.code))
                .map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.code} — {s.title}
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
      </FieldChrome>

      <FieldChrome id="slot-day" label="Day">
        <Select
          items={DAYS.map((d) => ({ value: d, label: dayLabels[d] }))}
          value={day}
          onValueChange={(v) => setDay(v as Day)}
        >
          <SelectTrigger id="slot-day">
            <SelectValue placeholder="Select day…" />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((d) => (
              <SelectItem key={d} value={d}>
                {dayLabels[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      <div className="grid grid-cols-2 gap-3">
        <FieldChrome id="slot-start" label="Start time">
          <Select
            items={TIME_SLOTS.slice(0, -1).map((t) => ({ value: t, label: formatTime(t) }))}
            value={startTime}
            onValueChange={(v) => setStartTime(v as string)}
          >
            <SelectTrigger id="slot-start">
              <SelectValue placeholder="Start time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.slice(0, -1).map((t) => (
                <SelectItem key={t} value={t}>
                  {formatTime(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
        <FieldChrome id="slot-end" label="End time">
          <Select
            items={TIME_SLOTS.filter((t) => timeToMinutes(t) > timeToMinutes(startTime)).map((t) => ({
              value: t,
              label: formatTime(t),
            }))}
            value={endTime}
            onValueChange={(v) => setEndTime(v as string)}
          >
            <SelectTrigger id="slot-end">
              <SelectValue placeholder="End time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.filter((t) => timeToMinutes(t) > timeToMinutes(startTime)).map((t) => (
                <SelectItem key={t} value={t}>
                  {formatTime(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>

      <FieldChrome id="slot-mode" label="Mode">
        <Select
          items={classModes.map((m) => ({ value: m, label: m }))}
          value={mode}
          onValueChange={(v) => setMode(v as ScheduleMode)}
          disabled={classModes.length === 0}
        >
          <SelectTrigger id="slot-mode">
            <SelectValue placeholder="Select mode…" />
          </SelectTrigger>
          <SelectContent>
            {classModes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      <FieldChrome
        id="slot-session-mode"
        label="Session mode"
        hint={isMajorWithLab ? undefined : "Regular/minor subjects are scheduled as lecture sessions."}
      >
        {isMajorWithLab ? (
          <Select
            items={sessionModes.map((value) => ({ value, label: value }))}
            value={sessionMode}
            onValueChange={(value) => setSessionMode(value ?? "")}
            disabled={sessionModes.length === 0}
          >
            <SelectTrigger id="slot-session-mode"><SelectValue placeholder="Select session mode…" /></SelectTrigger>
            <SelectContent>{sessionModes.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <div className={`${inputClassName} flex items-center text-slate-600 dark:text-slate-300`}>LEC</div>
        )}
      </FieldChrome>

      <FieldChrome id="slot-faculty" label="Faculty">
        {faculties.length === 0 ? (
          <div className={`${inputClassName} text-slate-400 dark:text-slate-500`}>
            No faculty assigned to this subject
          </div>
        ) : (
          <Combobox
            items={faculties.map((faculty) => String(faculty.id))}
            filteredItems={filteredFaculties.map((faculty) => String(faculty.id))}
            autoHighlight
            value={facultyId}
            onValueChange={(v) => setFacultyId(v as string)}
            itemToStringLabel={(id) => faculties.find((f) => String(f.id) === id)?.fullName ?? ""}
            inputValue={facultyQuery}
            onInputValueChange={setFacultyQuery}
          >
            <ComboboxInput id="slot-faculty" placeholder="Search faculty" />
            <ComboboxContent>
              <ComboboxEmpty>No faculty found.</ComboboxEmpty>
              <ComboboxList>
                {(id: string) => {
                  const faculty = faculties.find((candidate) => String(candidate.id) === id);
                  return faculty ? (
                    <ComboboxItem key={faculty.id} value={id}>
                      {faculty.fullName}
                    </ComboboxItem>
                  ) : null;
                }}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      </FieldChrome>

      {selectedFaculty && (
        <InstructorLoad
          faculty={selectedFaculty}
          existingSlots={existingSlots}
          initialSlot={initialSlot}
          startTime={startTime}
          endTime={endTime}
          savedSessionEdit={savedSessionEdit}
        />
      )}

      {needsRoom && (
        <FieldChrome id="slot-room" label="Room">
          <Select
            items={roomOptions.map((r) => ({
              value: String(r.id),
              label: r.buildingName
                ? `${r.buildingName} — ${r.roomName}`
                : r.roomName,
            }))}
            value={roomId}
            onValueChange={(v) => setRoomId(v as string)}
          >
            <SelectTrigger id="slot-room">
              <SelectValue placeholder="Select a room…" />
            </SelectTrigger>
            <SelectContent>
              {roomOptions.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.buildingName
                    ? `${r.buildingName} — ${r.roomName}`
                    : r.roomName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      )}

      <div className="flex flex-col gap-2">
        <Button>
          <PlusIcon />
          {isEditing ? "Update slot" : isConflictMove ? "Move slot" : "Add to schedule"}
        </Button>
        {isEditing && onCancelEdit && (
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel edit
          </Button>
        )}
      </div>
    </form>
  );
}

function InstructorLoad({
  faculty,
  existingSlots,
  initialSlot,
  startTime,
  endTime,
  savedSessionEdit = false,
}: {
  faculty: { id: number; fullName: string; maxWeeklyHours: number | null; currentWeeklyHours: number | null };
  existingSlots: PendingSlot[];
  initialSlot?: PendingSlot;
  startTime: string;
  endTime: string;
  savedSessionEdit?: boolean;
}) {
  const maxHours = faculty.maxWeeklyHours;
  if (!maxHours || maxHours <= 0) return null;

  let currentHours: number;
  if (savedSessionEdit) {
    const wasTheirs = initialSlot != null && initialSlot.facultyId === faculty.id;
    const originalDuration = wasTheirs
      ? getSlotDurationHours(initialSlot!.startTime, initialSlot!.endTime)
      : 0;
    currentHours = (faculty.currentWeeklyHours ?? 0) - originalDuration;
  } else {
    currentHours =
      (faculty.currentWeeklyHours ?? 0) +
      existingSlots
        .filter((s) => s.tempId !== initialSlot?.tempId && s.facultyId === faculty.id)
        .reduce((sum, s) => sum + getSlotDurationHours(s.startTime, s.endTime), 0);
  }

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
