import { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FormError } from "~/components/forms/form-error";
import { formatTime12h, timeToMinutes } from "~/lib/time";
import { MINIMUM_SELECTION_MINUTES } from "~/features/schedules/use-timetable-slot-selection";
import type { ScheduleFacultyOption } from "~/services/schedule.service";
import type { MajorTimetableSlot } from "~/features/schedules/major-scheduling-timetable-selection";
import type { PlacementDraft } from "~/features/schedules/adjustment-unplaced-panel";
import type {
  AdjustmentMeeting,
  AdjustmentRoom,
  AdjustmentSet,
  AdjustmentUnplacedSubject,
} from "~/types/schedule-adjustment";

/**
 * The board's one editing surface, drawn inside the map card.
 *
 * Deliberately a single panel with two jobs rather than two panels: the
 * Registrar is doing one thing at a time — moving a class that is in the way,
 * or placing one that was never fitted — and the map underneath is the same
 * either way. Nothing here writes; it collects a destination and hands it to
 * the page, which calls the validated backend routes.
 */

function slotLabel(slot: MajorTimetableSlot, roomName: string | null): string {
  const time = `${formatTime12h(slot.startTime)} – ${formatTime12h(slot.endTime)}`;
  return roomName ? `${slot.dayOfWeek}, ${time} · ${roomName}` : `${slot.dayOfWeek}, ${time}`;
}

function meetingLabel(meeting: AdjustmentMeeting): string {
  const time = `${formatTime12h(meeting.startTime ?? "")} – ${formatTime12h(meeting.endTime ?? "")}`;
  return meeting.roomName
    ? `${meeting.dayOfWeek}, ${time} · ${meeting.roomName}`
    : `${meeting.dayOfWeek}, ${time}`;
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-body text-xs leading-relaxed text-slate-600 dark:text-slate-300">{children}</p>
  );
}

type MoveProps = {
  kind: "move";
  /** A closed term is read-only — the backend refuses the write regardless. */
  termClosed?: boolean;
  meeting: AdjustmentMeeting;
  destination: MajorTimetableSlot | null;
  destinationRoom: AdjustmentRoom | null;
  error: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

type PlaceProps = {
  kind: "place";
  /** A closed term is read-only — the backend refuses the write regardless. */
  termClosed?: boolean;
  sets: AdjustmentSet[];
  drafts: PlacementDraft[];
  programId: number | null;
  onProgramChange: (id: number | null) => void;
  setId: number | null;
  onSetChange: (id: number | null) => void;
  subjectId: number | null;
  onSubjectChange: (id: number | null) => void;
  destination: MajorTimetableSlot;
  destinationRoom: AdjustmentRoom | null;
  /** Instructors assigned to this subject, with their weekly load. */
  faculties: ScheduleFacultyOption[];
  facultyId: number | null;
  onFacultyChange: (id: number | null) => void;
  error: string | null;
  onSubmit: () => void;
  onCancel: () => void;
};

export type AdjustmentBoardEditorProps = MoveProps | PlaceProps;

export function AdjustmentBoardEditor(props: AdjustmentBoardEditorProps) {
  if (props.kind === "move") return <MoveEditor {...props} />;
  return <PlaceEditor {...props} />;
}

function MoveEditor({
  termClosed,
  meeting,
  destination,
  destinationRoom,
  error,
  submitting,
  onSubmit,
  onCancel,
}: MoveProps) {
  const destinationMinutes = destination
    ? timeToMinutes(destination.endTime) - timeToMinutes(destination.startTime)
    : 0;
  const tooShort = destination != null && destinationMinutes < MINIMUM_SELECTION_MINUTES;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Moving a class
        </p>
        <h3 className="mt-0.5 font-display text-lg tracking-wide text-navy-800 dark:text-white">
          {meeting.subjectCode} · {meeting.setName}
        </h3>
      </div>

      <FormError message={error} />

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-2.5 dark:border-white/10">
          <p className="font-body text-xs font-semibold text-slate-500 dark:text-slate-400">From</p>
          <p className="mt-0.5 font-body text-xs font-medium text-slate-700 dark:text-slate-200">
            {meetingLabel(meeting)}
          </p>
        </div>
        <div
          className={`rounded-lg border p-2.5 ${
            destination
              ? "border-sky-300 bg-sky-50/70 dark:border-sky-400/30 dark:bg-sky-400/5"
              : "border-dashed border-slate-300 dark:border-white/15"
          }`}
        >
          <p className="font-body text-xs font-semibold text-slate-500 dark:text-slate-400">To</p>
          <p className="mt-0.5 font-body text-xs font-medium text-slate-700 dark:text-slate-200">
            {destination
              ? slotLabel(destination, destinationRoom?.name ?? null)
              : "Click a free cell on the map"}
          </p>
        </div>
      </div>

      {termClosed ? (
        <Hint>
          This term is closed. Its schedules are a permanent record and cannot be moved.
        </Hint>
      ) : tooShort ? (
        <Hint>
          {destinationMinutes} minutes is below the required 1-hour minimum.
          Please select a time block of at least 60 minutes in this room and day to maintain the subject's weekly hours.
        </Hint>
      ) : destination ? (
        <Hint>
          Room, instructor, section, daily and weekly caps, the lab grid and operating hours
          are all re-checked when this is submitted — a destination that breaks one is
          refused with the reason.
        </Hint>
      ) : (
        <Hint>
          Pick the destination on the map. Every class meeting requires at least 1 hour.
        </Hint>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          block={false}
          disabled={!destination || tooShort || submitting || Boolean(termClosed)}
          isLoading={submitting}
          loadingLabel="Moving"
          onClick={onSubmit}
        >
          Move class
        </Button>
        <Button type="button" variant="outline" block={false} disabled={submitting} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function PlaceEditor({
  termClosed,
  sets,
  drafts,
  programId,
  onProgramChange,
  setId,
  onSetChange,
  subjectId,
  onSubjectChange,
  destination,
  destinationRoom,
  faculties,
  facultyId,
  onFacultyChange,
  error,
  onSubmit,
  onCancel,
}: PlaceProps) {
  function remainingForSubject(set: AdjustmentSet, subject: AdjustmentUnplacedSubject) {
    const staged = drafts.filter(
      (draft) => draft.setId === set.setId && draft.subjectId === subject.subjectId,
    ).length;
    return Math.max(0, subject.remaining - staged);
  }

  function subjectFitsDestination(
    set: AdjustmentSet,
    subject: AdjustmentUnplacedSubject,
  ) {
    if (remainingForSubject(set, subject) === 0) return false;

    const laboratory = destinationRoom?.type === "Laboratory";
    if (subject.subjectType !== "Major with Lab") return !laboratory;

    const placedModes = new Set([
      ...subject.placedSessionModes,
      ...drafts
        .filter(
          (draft) =>
            draft.setId === set.setId && draft.subjectId === subject.subjectId,
        )
        .map((draft) => draft.sessionMode),
    ]);
    return laboratory ? !placedModes.has("LAB") : !placedModes.has("LEC");
  }

  const eligibleSets = sets.filter(
    (set) =>
      set.editable &&
      set.unplaced.some((subject) => subjectFitsDestination(set, subject)) &&
      (!destinationRoom ||
        destinationRoom.programIds.length === 0 ||
        destinationRoom.programIds.includes(set.programId)),
  );
  const programs = [...new Map(
    eligibleSets.map((set) => [set.programId, set.programAbbrev ?? `Program ${set.programId}`]),
  ).entries()].sort((a, b) => a[1].localeCompare(b[1]));

  const programSets = eligibleSets
    .filter((set) => set.programId === programId)
    .sort((a, b) => (a.setName ?? a.setCode).localeCompare(b.setName ?? b.setCode));
  const selectedSet = programSets.find((set) => set.setId === setId) ?? null;
  const subjects = (selectedSet?.unplaced ?? []).filter(
    (subject) => selectedSet != null && subjectFitsDestination(selectedSet, subject),
  );
  const subject = subjects.find((item) => item.subjectId === subjectId) ?? null;

  const facultyItems = useMemo(
    () =>
      faculties.map((faculty) => ({
        value: String(faculty.id),
        label:
          faculty.currentWeeklyHours != null && faculty.maxWeeklyHours != null
            ? `${faculty.fullName} — ${faculty.currentWeeklyHours}/${faculty.maxWeeklyHours} hrs`
            : faculty.fullName,
      })),
    [faculties],
  );

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Selected timetable range
        </p>
        <h3 className="mt-0.5 font-display text-lg tracking-wide text-navy-800 dark:text-white">
          {slotLabel(destination, destinationRoom?.name ?? null)}
        </h3>
      </div>

      <FormError message={error} />

      {programs.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 font-body text-xs leading-relaxed text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/5 dark:text-amber-200">
          No unfinished section has a subject that can use this room and session type.
          Select another timetable range.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="place-program">Program</Label>
          <Select
            items={[
              { value: "", label: "Select program" },
              ...programs.map(([id, label]) => ({ value: String(id), label })),
            ]}
            value={programId == null ? "" : String(programId)}
            onValueChange={(value) => onProgramChange(value ? Number(value) : null)}
            disabled={programs.length === 0}
          >
            <SelectTrigger id="place-program">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select program</SelectItem>
              {programs.map(([id, label]) => (
                <SelectItem key={id} value={String(id)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="place-set">Section / Set</Label>
          <Select
            items={[
              { value: "", label: "Select section/set" },
              ...programSets.map((set) => ({
                value: String(set.setId),
                label: set.setName ?? set.setCode,
              })),
            ]}
            value={setId == null ? "" : String(setId)}
            onValueChange={(value) => onSetChange(value ? Number(value) : null)}
            disabled={programId == null}
          >
            <SelectTrigger id="place-set">
              <SelectValue placeholder="Select section/set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select section/set</SelectItem>
              {programSets.map((set) => (
                <SelectItem key={set.setId} value={String(set.setId)}>
                  {set.setName ?? set.setCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="place-subject">Subject</Label>
          <Select
            items={[
              { value: "", label: "Select subject" },
              ...subjects.map((subject) => ({
                value: String(subject.subjectId),
                label: `${subject.subjectCode} — ${subject.subjectTitle}`,
              })),
            ]}
            value={subjectId == null ? "" : String(subjectId)}
            onValueChange={(value) => onSubjectChange(value ? Number(value) : null)}
            disabled={setId == null}
          >
            <SelectTrigger id="place-subject">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select subject</SelectItem>
              {subjects.map((item) => (
                <SelectItem
                  key={item.subjectId}
                  value={String(item.subjectId)}
                >
                  {item.subjectCode} — {item.subjectTitle} ({remainingForSubject(selectedSet!, item)} left)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="place-faculty">Instructor</Label>
          <Select
            items={[{ value: "", label: "TBA — Floating Schedule" }, ...facultyItems]}
            value={facultyId == null ? "" : String(facultyId)}
            onValueChange={(value) => onFacultyChange(value ? Number(value) : null)}
            disabled={subjectId == null}
          >
            <SelectTrigger id="place-faculty">
              <SelectValue placeholder="TBA — Floating Schedule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">TBA — Floating Schedule</SelectItem>
              {facultyItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {termClosed ? (
        <Hint>
          This term is closed. Its schedules are a permanent record and cannot be changed.
        </Hint>
      ) : null}
      <Hint>
        {destinationRoom?.type === "Laboratory" ? "Laboratory" : "Lecture"} is determined
        by the selected room, as in Major Scheduling. This placement is staged until its
        section is complete and saved from the Placement queue.
      </Hint>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          block={false}
          disabled={!selectedSet || !subject || Boolean(termClosed)}
          onClick={onSubmit}
        >
          Add to plan
        </Button>
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
