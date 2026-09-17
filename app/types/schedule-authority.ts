export type MajorWorkflowStatus =
  | "draft"
  | "submitted"
  | "reopened"
  | "finalized";

export type MajorSchedule = {
  id: number;
  syId: number;
  semesterNumber: number;
  programId: number;
  programAbbrev: string;
  setId: number;
  setName: string;
  subjectId: number;
  subjectCode: string;
  subjectTitle: string;
  subjectType: "Major with Lab" | "Major without Lab";
  /** How the class is delivered — F2F unless the Dean said otherwise. */
  classMode: string;
  /** Which half of the subject this meeting is. */
  sessionMode: "LEC" | "LAB";
  instructorId: number | null;
  instructorDisplay: string;
  floating: boolean;
  /** Null for a Synchronous or Asynchronous meeting, which holds no room. */
  roomId: number | null;
  /** Seats in that room; null when the room has none recorded, or is roomless. */
  roomCapacity: number | null;
  /** Students in this meeting's section for its term. */
  studentCount: number | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  workflowStatus: MajorWorkflowStatus;
  isDraft: boolean;
  protected: boolean;
  submissionId: number;
  departmentAbbrev?: string | null;
  departmentName?: string | null;
};

/**
 * What staffing a TBA subject changed.
 *
 * SUBJECT-WIDE. The request names one meeting — the card that was clicked —
 * but it means "give this meeting's subject an instructor in this section", so
 * a subject that meets Monday and Wednesday is staffed on both days or on
 * neither. One subject of one section is taught by one person, and the two
 * states a per-meeting call would pass through on the way there (a real
 * instructor beside a TBA sibling, and two real instructors) are not states
 * the college recognises.
 *
 * Repaint from `updatedSchedules`, or patch each sibling it names. Touching
 * only the clicked card leaves the siblings showing TBA on screen while the
 * database says otherwise.
 */
export type FloatingInstructorAssignment = {
  message: string;
  /**
   * How many meetings the subject has in this section — 0 from a backend too
   * old to say. Normalized by the service, never read raw off the wire.
   */
  updatedCount: number;
  /**
   * EVERY meeting of the subject, as it now stands. Empty from a backend too
   * old to send them, which is why the service normalizes rather than trusting
   * the wire — typing these as present when they can be absent is how a caller
   * following the advice above gets a TypeError on `.map`.
   */
  updatedSchedules: MajorSchedule[];
};

export type DeanDraftResetOption = {
  programId: number;
  programAbbrev: string;
  programName: string;
  draftMeetingCount: number;
};

export type DeanDraftResetOptions = {
  programs: DeanDraftResetOption[];
  /** Meetings already submitted or finalized, which a reset cannot touch. */
  lockedMeetingCount: number;
};

export type DeanDraftResetResult = {
  message: string;
  deleted: number;
};
