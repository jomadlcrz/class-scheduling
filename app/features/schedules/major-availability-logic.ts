import type {
  AvailabilityHours,
  AvailabilityInstructor,
  AvailabilityRoom,
} from "~/types/major-scheduling-availability";

/**
 * The Availability drawer's decisions, with no rendering attached.
 *
 * Split out for the same reason major-slot-fit.ts is: these are the rules the
 * drawer is judged on, and they are worth testing against the cases that
 * motivated them rather than through a browser.
 */

export function hoursLabel(hours: number) {
  const rounded = Number(hours.toFixed(2));
  return `${rounded} ${rounded === 1 ? "hr" : "hrs"}`;
}

/** Mon/Tue/… — a breach is only actionable if it names its day. */
export function shortDays(days: string[]) {
  return days.map((day) => day.slice(0, 3)).join(", ");
}

/**
 * One day as hours taken out of hours the day actually has.
 *
 * The denominator is the operating window — 7:00–18:00, eleven hours — and NOT
 * a cap. That is the whole fix. A cap is a stored figure with a history: it is
 * raised one weekday at a time and never lowered, so it can outlive the
 * schedule that raised it and still render as though a Dean had chosen it.
 * "10/9.5" was exactly that, and no reading of the row could explain the 9.5,
 * because nothing on the row produced it.
 *
 * The operating day produces itself. Add up the blocks listed underneath — four
 * at 2.5 hours — add the free window at the top, and you get the denominator
 * back. Every figure in the panel is now checkable against the panel.
 *
 * Compliance is not in this number and is not in this panel. Whether a load
 * complies with a policy is a different question, asked elsewhere and answered
 * against figures this drawer has no business restating. Here the only question
 * is whether anything more will fit.
 */
export function dayHoursLabel(hours: AvailabilityHours, operatingHours: number) {
  const taken = Number(hours.assigned.toFixed(2));
  const available = Number(operatingHours.toFixed(2));
  return `${taken} / ${available} hrs`;
}

/** The same day spelled out, with what is left of it named outright. */
export function dayHoursTitle(hours: AvailabilityHours, operatingHours: number) {
  const free = Number((operatingHours - hours.assigned).toFixed(2));
  return `${hoursLabel(hours.assigned)} of the ${hoursLabel(operatingHours)} operating day · ${hoursLabel(free)} free`;
}

/** A room's day, read the same way: hours held, out of hours it has. */
export function roomHoursLabel(freeHours: number, operatingHours: number) {
  const available = Number(operatingHours.toFixed(2));
  const taken = Number((operatingHours - freeHours).toFixed(2));
  return `${taken} / ${available} hrs`;
}

/**
 * Days with no room left in them.
 *
 * This replaced capStanding, which reported days at or over a stored daily
 * cap. Two things were wrong with that as this panel's warning. The cap is a
 * high-water mark raised by past saves and never lowered, so it could sit
 * below what the day physically holds — flagging a day with hours still free —
 * or above it, staying quiet on a day that was full. And it answered a
 * question this drawer does not ask: whether a load complies, rather than
 * whether anything more will fit.
 *
 * A day is full when nothing is left of the operating window. That is the
 * answer to "can I still put a class here", it is true independently of any
 * policy, and it is visible in the row: no free windows listed.
 */
export function fullDays(person: AvailabilityInstructor) {
  return person.byDay.filter((day) => day.free.length === 0).map((day) => day.day);
}

/** The same reading for a room — every day of it already spoken for. */
export function fullRoomDays(room: AvailabilityRoom) {
  return room.byDay.filter((day) => day.free.length === 0).map((day) => day.day);
}

/**
 * Ordering, and why it changes with the question being asked.
 *
 * With a slot chosen this is a SHORTLIST — "where can this go" — so whatever
 * is free belongs at the top and the rest can be scrolled past.
 *
 * Without one it is a DIRECTORY, and it stays in the server's order (rooms by
 * building then name, instructors by surname) because that is how someone
 * FINDS a specific room or person. Sorting it by free hours instead was
 * actively worse: it floated every untouched room and unloaded instructor to
 * the top, so the first screen was a dozen identical rows and the one carrying
 * 55 of 60 hours was at the bottom.
 */
export function sortRooms(rooms: AvailabilityRoom[], hasSlot: boolean) {
  if (!hasSlot) return rooms;
  return [...rooms].sort(
    (left, right) =>
      Number(right.freeForSlot) - Number(left.freeForSlot) ||
      right.freeHours - left.freeHours,
  );
}

/**
 * Same rule, plus one key that outranks availability: an instructor not
 * assigned to the subject is not a candidate however free they are. That key
 * applies whenever a subject was named, slot or not, because it changes who is
 * eligible rather than who is convenient.
 */
export function sortInstructors(
  instructors: AvailabilityInstructor[],
  hasSlot: boolean,
) {
  const subjectNamed = instructors.some(
    (person) => person.assignedToSubject != null,
  );
  if (!hasSlot && !subjectNamed) return instructors;
  return [...instructors].sort((left, right) => {
    const byAssigned =
      Number(right.assignedToSubject ?? false) -
      Number(left.assignedToSubject ?? false);
    if (byAssigned !== 0) return byAssigned;
    if (hasSlot) {
      const byFree = Number(right.freeForSlot) - Number(left.freeForSlot);
      if (byFree !== 0) return byFree;
      const byCaps = Number(right.fitsCapsForSlot) - Number(left.fitsCapsForSlot);
      if (byCaps !== 0) return byCaps;
    }
    return right.weekly.remaining - left.weekly.remaining;
  });
}
