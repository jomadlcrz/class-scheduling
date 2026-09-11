import { timeToMinutes } from "~/lib/time";

/**
 * Canonical slot shape shared by the Dean and Registrar Major Scheduling
 * timetables. Keep selection rules here so the two portals cannot drift.
 * Contract: docs/ui/room-scheduling-map-standard.md#selection-behavior
 */
export type MajorTimetableSlot = {
  roomId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

export type MajorTimetableMeeting = MajorTimetableSlot & {
  id?: number;
};

export function formatTimetableMinutes(totalMinutes: number) {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

export function isSameTimetableTrack(
  left: MajorTimetableSlot | null | undefined,
  right: MajorTimetableSlot,
) {
  return (
    left?.roomId === right.roomId && left.dayOfWeek === right.dayOfWeek
  );
}

export function isTimetableSlotSelected(
  selection: MajorTimetableSlot | null | undefined,
  slot: MajorTimetableSlot,
) {
  return (
    isSameTimetableTrack(selection, slot) &&
    timeToMinutes(slot.startTime) >= timeToMinutes(selection!.startTime) &&
    timeToMinutes(slot.endTime) <= timeToMinutes(selection!.endTime)
  );
}

/**
 * Extends one continuous free-cell range. Shift never creates the first
 * anchor and never changes room/day: the user must select a free cell first.
 * Every persisted/rendered meeting is an occupied boundary, including the
 * meeting currently selected for moving.
 */
export function extendMajorTimetableSelection({
  origin,
  target,
  meetings,
  laboratory = false,
}: {
  origin: MajorTimetableSlot | null | undefined;
  target: MajorTimetableSlot;
  meetings: readonly MajorTimetableMeeting[];
  laboratory?: boolean;
}): MajorTimetableSlot | null {
  if (!origin || !isSameTimetableTrack(origin, target)) return null;
  if (laboratory) return target;

  const start = Math.min(
    timeToMinutes(origin.startTime),
    timeToMinutes(target.startTime),
  );
  const end = Math.max(
    timeToMinutes(origin.endTime),
    timeToMinutes(target.endTime),
  );
  const crossesOccupiedMeeting = meetings.some(
    (meeting) =>
      meeting.roomId === target.roomId &&
      meeting.dayOfWeek === target.dayOfWeek &&
      timeToMinutes(meeting.startTime) < end &&
      timeToMinutes(meeting.endTime) > start,
  );
  if (crossesOccupiedMeeting) return null;

  return {
    roomId: target.roomId,
    dayOfWeek: target.dayOfWeek,
    startTime: formatTimetableMinutes(start),
    endTime: formatTimetableMinutes(end),
  };
}
