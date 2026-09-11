/**
 * Amending a schedule that is already published — see
 * schedules/services/published_amendments.py.
 *
 * Two amendments, sharing one rationale. An instructor resigned in week two of
 * a live semester and her classes had to go TBA; a class hit by a typhoon week
 * has to move online. Neither was expressible: a published release is APPROVED,
 * APPROVED is not a content-editable status, and the ordinary editor refuses.
 *
 * These are not edits to the timetable. WHEN a class meets and WHICH students
 * it is for never change — only who stands in front of it, and whether they
 * stand in front of it at all. That is why they are allowed on a published
 * term while every other edit stays locked.
 */

/** One meeting, as the amendment endpoints report it. */
export type AmendableMeeting = {
  scheduleId: number;
  syId: number;
  semesterNumber: number;
  programId: number;
  setId: number;
  setName: string | null;
  subjectId: number;
  subjectCode: string | null;
  dayOfWeek: string | null;
  startTime: string | null; // "HH:MM", 24h
  endTime: string | null;
  roomName: string | null;
  instructorId: number | null;
  instructorName: string | null;
  classMode: string;
  sessionMode: string;
  /** Nobody is assigned. The portals render this as TBA. */
  isFloating: boolean;
};

/** What one instructor is still on the timetable for. */
export type InstructorHoldings = {
  instructorProfileId: number;
  instructorName: string;
  isActive: boolean;
  meetingCount: number;
  sectionCount: number;
  subjectCount: number;
  weeklyHours: number;
  meetings: AmendableMeeting[];
};

/**
 * The result of changing who teaches a published SUBJECT.
 *
 * The request names one meeting — the card that was clicked — but it means
 * "change who teaches this meeting's subject in this section", and a subject
 * that meets Monday and Wednesday changes on both days or on neither. One
 * subject of one section is taught by one person, so a per-meeting change
 * could only reach that state by passing through a real instructor beside a
 * TBA sibling, or two real instructors, and the college recognises neither.
 */
export type InstructorChangeResult = {
  reason: string;
  previousInstructorId: number | null;
  /** The anchor meeting — the id that was sent. Kept for compatibility. */
  schedule: AmendableMeeting;
  /**
   * How many meetings the subject has — 0 from a backend too old to say.
   * Normalized by the service, never read raw off the wire.
   */
  updatedCount: number;
  /**
   * EVERY meeting of the subject, as it now stands. Refresh from these:
   * repainting only `schedule` leaves the siblings showing the old instructor
   * on screen while the database says otherwise. Empty from a backend too old
   * to send them, which is why the service normalizes rather than trusting the
   * wire — typing these as present when they can be absent is how a caller
   * following the advice above gets a TypeError on `.map`.
   */
  updatedSchedules: AmendableMeeting[];
};

export type VacancyResult = {
  instructorProfileId: number;
  syId: number;
  semesterNumber: number;
  reason: string;
  vacatedCount: number;
  vacated: AmendableMeeting[];
};

export type ClassModeChangeResult = {
  reason: string;
  previousClassMode: string;
  previousRoomId: number | null;
  /** The meeting went online and gave up the room it was holding. */
  releasedRoom: boolean;
  /**
   * The result contradicts the term's ClassModePolicy. Reported, never
   * refused: that policy is read by generation to plan delivery and has never
   * been enforced on save, so overriding it here is a deliberate act rather
   * than a rule being broken.
   */
  divergesFromPolicy: boolean;
  schedule: AmendableMeeting;
};

/**
 * `roomId` is three-state and the absence matters: omit the key to let the
 * mode decide, send null for no room, send an id to take that one. Optional
 * chaining it away would collapse the first two, which is the bug that made a
 * TBA instructor unreachable through the ordinary update endpoint.
 */
export type ClassModeChangeInput = {
  classMode: string;
  roomId?: number | null;
  reason: string;
};

/** Every mode a published meeting can be moved to, and what each does to its room. */
export const CLASS_MODE_CHOICES: {
  value: string;
  label: string;
  roomRule: "requires" | "forbids" | "optional";
  hint: string;
}[] = [
  {
    value: "F2F",
    label: "Face-to-face",
    roomRule: "requires",
    hint: "On campus. Needs a room, and it has to be free at this hour.",
  },
  {
    value: "Synchronous",
    label: "Synchronous (online, live)",
    roomRule: "forbids",
    hint: "Online at this hour. The room is released — a class nobody attends in person must not hold one.",
  },
  {
    value: "Asynchronous",
    label: "Asynchronous (online, own time)",
    roomRule: "forbids",
    hint: "No fixed hour and no room. It stops clashing with anything, and nothing clashes with it.",
  },
  {
    value: "Blended",
    label: "Blended",
    roomRule: "optional",
    hint: "Partly on campus. Keep a room for the weeks it meets there, or none for the weeks it does not.",
  },
];
