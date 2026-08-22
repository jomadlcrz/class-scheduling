/** Backend-owned schedule-release workflow states. */
export type ScheduleReleaseStatus =
  | "draft"
  | "pending_dean_review"
  | "instructor_review"
  | "registrar_revision"
  | "pending_final_approval"
  | "approved"
  | "rejected";

export type ScheduleReleaseSubmitter = { userId: number; name: string | null };
export type ScheduleReleaseApprover = { userId: number; name: string | null };

/** Shared release object returned by both the registrar and dean endpoints. */
export type ScheduleRelease = {
  id: number;
  referenceCode: string | null;
  syId: number;
  semesterNumber: number;
  setId: number;
  setCode: string | null;
  yearLevel: number | null;
  programId: number;
  programAbbrev: string | null;
  releaseStatus: ScheduleReleaseStatus;
  allowedTransitions: ScheduleReleaseStatus[];
  sessionCount: number;
  subjectCount: number;
  generatedMeetingCount: number;
  majorMeetingCount: number;
  tbaCount: number;
  submissionNote: string | null;
  submittedAt: string | null;
  submittedBy: ScheduleReleaseSubmitter | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  approvedBy?: ScheduleReleaseApprover | null;
};

export type SchedulePreviewSession = {
  subjectId: number;
  subjectCode: string | null;
  instructorId: number | null;
  instructorName: string | null;
  roomId: number | null;
  roomName: string | null;
  mode: string;
  /** "9:00 AM"-style, same format as scheduleService.view()'s class_time. */
  startTime: string;
  endTime: string;
};

export type SchedulePreviewDay = {
  dayOfWeek: string;
  subjectSchedules: SchedulePreviewSession[];
};

export type SchedulePreview = {
  release: ScheduleRelease;
  daySchedules: SchedulePreviewDay[];
};

export type DeanApprovalsInboxTerm = {
  syId: number;
  schoolYear: string | null;
  semesterNumber: number;
  semesterName: string | null;
};

export type DeanApprovalsInbox = {
  term: DeanApprovalsInboxTerm | null;
  stageCounts?: Partial<Record<ScheduleReleaseStatus, number>>;
  summary?: {
    pending: number;
    stale: number;
    approved: number;
    returned: number;
  };
  filterOptions?: {
    programs: Array<{ abbrev: string; name: string }>;
    yearLevels: number[];
    sets: Array<{ setId: number; setCode: string; programAbbrev: string; yearLevel: number }>;
  };
  items?: ScheduleRelease[];
  pagination?: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
  pending: ScheduleRelease[];
  recentlyReviewed: ScheduleRelease[];
};

export type DeanProgramApprovalBlockedSet = {
  setId: number;
  setCode: string;
  reason: string;
};

export type DeanProgramApprovalResult = {
  message: string;
  programAbbrev: string;
  sentSetIds: number[];
  blocked: DeanProgramApprovalBlockedSet[];
  skippedSetIds: number[];
  termDistributed?: boolean;
};

export type DeanProgramRejectResult = {
  message: string;
  programAbbrev: string;
  rejectedSetIds: number[];
  skippedSetIds: number[];
};

export type InstructorReviewProgressItem = {
  instructorId: number;
  instructorName: string;
  meetingCount: number;
  responseType: "accept" | "suggest_change" | null;
  respondedAt: string | null;
  status: string;
  reason: string | null;
  proposedMeetings?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    roomId: number;
    roomName?: string | null;
  }[];
};

export type DeanReviewProgress = {
  releaseId: number;
  totalInstructors: number;
  respondedCount: number;
  pendingCount: number;
  acceptedCount: number;
  suggestedCount: number;
  allAccepted: boolean;
  hasSuggestions: boolean;
  instructors: InstructorReviewProgressItem[];
};

export type RegistrarRevisionWorkspaceSuggestion = {
  responseId: number;
  instructorId: number;
  instructorName: string;
  scheduleId: number;
  subjectId: number | null;
  subjectCode: string | null;
  subjectTitle: string | null;
  reason: string | null;
  status: string;
  currentMeeting: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    roomId: number;
    roomName: string | null;
  };
  proposedMeetings: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    roomId: number;
    roomName?: string | null;
  }[];
};

export type RegistrarRevisionWorkspace = {
  releaseId: number;
  release: ScheduleRelease;
  suggestions: RegistrarRevisionWorkspaceSuggestion[];
  pendingSuggestionsCount: number;
};

