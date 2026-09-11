import type { SuggestionMove, SuggestionValidation } from "~/types/instructor-review";
export type MajorWorkflowStatus =
  | "draft"
  | "submitted"
  | "reopened"
  | "finalized";
export type WorkflowDecisionStatus =
  | "pending"
  | "approved"
  | "forwarded"
  | "rejected"
  | "applied";

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

export type MajorScheduleSubmission = {
  id: number;
  departmentId: number;
  departmentName: string;
  departmentAbbrev: string;
  syId: number;
  schoolYear: string;
  semesterNumber: number;
  semesterLabel?: string;
  status: MajorWorkflowStatus;
  readyToSubmit: boolean;
  meetingCount: number;
  submittedAt: string | null;
  submittedBy: {
    userId: number;
    name: string;
    email: string;
    role: string;
  } | null;
  finalizedAt: string | null;
  finalizedBy: {
    userId: number;
    name: string;
    email: string;
    role: string;
  } | null;
  reopenedAt?: string | null;
  reopenedBy?: {
    userId: number;
    name: string;
    email: string;
    role: string;
  } | null;
  reopenReason?: string | null;
};

export type MajorLabTimeSlot = {
  slotId: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  period: "morning" | "afternoon";
  slotDisplay: string;
};

export type MajorScheduleSummaryMetrics = {
  requiredSetCount: number;
  completedSetCount: number;
  uniqueSubjectCount: number;
  meetingCount: number;
  lecMeetingCount: number;
  labMeetingCount: number;
  scheduledHours: number;
  requiredHours: number;
  roomCount: number;
  lectureRoomCount: number;
  laboratoryRoomCount: number;
  onlineMeetingCount: number;
  instructorCount: number;
  tbaMeetingCount: number;
};

export type MajorScheduleSummary = {
  scope: "dean" | "registrar";
  syId: number;
  semesterNumber: number;
  submissionStatus: string | null;
  readyToSubmit: boolean;
  totals: MajorScheduleSummaryMetrics;
  workflow: {
    requiredDepartmentCount: number;
    finalizedDepartmentCount: number;
  };
};

export type MajorSchedulePlacementConflicts = {
  roomConflicts: {
    scheduleId: number;
    subjectCode: string;
    setName: string;
    roomName: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  instructorConflicts: {
    scheduleId: number;
    subjectCode: string;
    setName: string;
    instructorName: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  setConflicts: {
    scheduleId: number;
    subjectCode: string;
    setName: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
};

export type CreateMajorSchedulePayload = {
  syId: number;
  semesterNumber: number;
  programId: number;
  setId: number;
  subjectId: number;
  sessionMode: "LEC" | "LAB";
  classMode?: string;
  instructorId?: number | null;
  roomId?: number | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

export type UpdateMajorSchedulePayload = Partial<CreateMajorSchedulePayload>;

export type InstructorProposalMeeting = {
  id: number;
  regularScheduleId?: number | null;
  subjectId: number;
  subjectCode: string;
  subjectTitle: string;
  subjectType: string;
  units: number;
  classMode: string;
  sessionMode: "LEC" | "LAB";
  setId: number;
  setName: string;
  yearLevel: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: number | null;
  roomName: string | null;
  roomType?: string | null;
};

export type InstructorProposal = {
  responseId: number;
  instructorId: number;
  instructorName: string;
  departmentId: number;
  departmentName: string;
  departmentAbbrev: string;
  syId: number;
  schoolYear: string;
  semesterNumber: number;
  reason: string;
  status: WorkflowDecisionStatus;
  decisionMessage: string | null;
  currentSchedule: InstructorProposalMeeting[];
  proposedSchedule: InstructorProposalMeeting[];
  moves?: SuggestionMove[];
  impactSummary?: string[];
  submittedAt: string;
  decidedAt: string | null;
  decidedBy: {
    userId: number;
    name: string;
    role: string;
  } | null;
  forwardedAt: string | null;
  validation?: SuggestionValidation;
  conflictDetails?: {
    type: string;
    message: string;
    conflictingMeeting?: {
      subjectCode: string;
      setName: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      roomName?: string | null;
    };
  }[];
  reconciliationNotes?: string | null;
};

export type InstructorProposalDecisionPayload = {
  decision: "approve" | "reject" | "forward" | "apply";
  message?: string;
  reconciliationNotes?: string;
  targetTeachingTermId?: number;
};

export type InstructorResponseSummary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  forwarded: number;
  applied: number;
};

export type InstructorAcceptanceSummary = {
  totalAssignedInstructors: number;
  acceptedCount: number;
  changeRequestedCount: number;
  noResponseCount: number;
  acceptanceRate: number;
};

export type PublishedProgram = {
  programId: number;
  programAbbrev: string;
};

export type MajorSessionMode = "LEC" | "LAB";

export type MajorAssignedInstructor = {
  instructorId: number;
  displayName: string;
};

export type MajorRequirementMeeting = {
  scheduleId: number;
  sessionMode: MajorSessionMode;
  instructorId: number | null;
};

export type MajorRequirement = {
  submissionId: number;
  departmentId: number;
  programId: number;
  programAbbrev: string;
  programName: string;
  setId: number;
  setName: string;
  yearLevel: number;
  semesterNumber: number;
  subjectId: number;
  curriculumDetailId: number;
  subjectCode: string;
  subjectTitle: string;
  subjectType: string;
  assignedInstructors: MajorAssignedInstructor[];
  meetings: MajorRequirementMeeting[];
  requiredSessionModes: MajorSessionMode[];
  satisfiedSessionModes: MajorSessionMode[];
  missingSessionModes: MajorSessionMode[];
  requiredSessionHours?: string;
  requiredWeeklyHours?: string;
  scheduledHours?: string;
  remainingHours?: string;
  isSatisfied: boolean;
  canCreateAdjustment: boolean;
  programPublished: boolean;
  adjustmentBlockedReason: string | null;
  blended?: {
    onlineCount: number;
    inRoomCount: number;
    missingBlendedHalves: ("inRoom")[];
    isPaired: boolean;
  } | null;
};

export type MajorRequirementSet = {
  submissionId: number;
  departmentId: number;
  syId: number;
  semesterNumber: number;
  status: MajorWorkflowStatus;
  requirements: MajorRequirement[];
  unsatisfiedCount: number;
  publishedPrograms: PublishedProgram[];
};

export type DeanDraftResetResult = {
  message: string;
  deleted: number;
};
