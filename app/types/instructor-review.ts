import type { ScheduleRelease } from "./schedule-release";

export type InstructorReviewResponseType = "accept" | "suggest_change";
export type InstructorReviewStatus = "pending" | "forwarded" | "applied" | "rejected";
export type InstructorMeetingReviewState =
  | "protected"
  | "accepted"
  | "awaiting_decision"
  | "applied"
  | "not_applied"
  | "unchanged";

export type InstructorReviewMeeting = {
  scheduleId: number;
  subjectId: number;
  subjectCode: string | null;
  subjectTitle: string | null;
  subjectType: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: number | null;
  roomName: string | null;
  classMode: string;
  sessionMode: "LEC" | "LAB" | null;
  isProtected: boolean;
  scheduleOrigin: string | null;
  reviewState?: InstructorMeetingReviewState;
  reviewStateLabel?: string;
};

export type InstructorReviewContextMeeting = InstructorReviewMeeting & {
  programAbbrev: string | null;
  yearLevel: number | null;
  setCode: string | null;
};

export type InstructorReviewResponse = {
  id: number;
  responseType: InstructorReviewResponseType;
  status: InstructorReviewStatus;
  respondedAt: string | null;
  reason?: string | null;
};

export type InstructorReviewActionResult = {
  response: InstructorReviewResponse;
  message: string;
};

export type ProposedMeeting = {
  scheduleId: number | null;
  setId?: number;
  subjectId?: number;
  sessionMode?: "LEC" | "LAB" | null;
  classMode?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: number | null;
  originalSlot?: {
    dayOfWeek: string | null;
    startTime: string | null;
    endTime: string | null;
    roomId: number | null;
  } | null;
};

export type InstructorReviewSummary = {
  releaseId: number;
  setId: number;
  syId: number;
  semesterNumber: number;
  programAbbrev: string | null;
  yearLevel: number | null;
  setCode: string | null;
  schoolYear: string | null;
  releaseStatus: string;
  responseId: number;
  responseStatus: InstructorReviewStatus;
  responseType: InstructorReviewResponseType;
  respondedAt: string | null;
};

export type SuggestionValidation = {
  checkCode: string;
  status: "passed" | "failed" | "warning" | "deferred";
  detail: string | null;
  scheduleId: number | null;
  createdAt: string | null;
};

export type ResolutionAnswer = {
  outcome: "satisfied" | "rejected" | "blocked_by_major";
  headline: string;
  detail: string;
  settled: boolean;
  runId: number | null;
  decidedAt: string | null;
};

export type InstructorReviewDetail = InstructorReviewSummary & {
  acceptedScheduleIds?: number[];
  validations: SuggestionValidation[];
  reason: string | null;
  canRespond: boolean;
  canSuggest: boolean;
  suggestionAttemptLimit: number | null;
  suggestionAttemptsUsed: number;
  suggestionAttemptsRemaining: number | null;
  deanDecisionNote: string | null;
  deanReviewedAt: string | null;
  registrarDecisionNote: string | null;
  registrarReviewedAt: string | null;
  meetings: InstructorReviewMeeting[];
  otherMeetings: InstructorReviewContextMeeting[];
  proposedMeetings: ProposedMeeting[];
  resolution: ResolutionAnswer | null;
};

export type InstructorSuggestPayload = {
  reason: string;
  targetScheduleId?: number;
  meetings: ProposedMeeting[];
};

export type DeanReviewParticipant = {
  instructorId: number;
  instructorName: string;
  responseId: number;
  meetingCount: number;
  responseType: InstructorReviewResponseType | null;
  responseStatus: InstructorReviewStatus;
  respondedAt: string | null;
  remarks: string | null;
  moves: SuggestionMove[];
  proposedMeetings: ProposedMeeting[];
};

export type DeanReviewProgress = {
  releaseId: number;
  releaseStatus: string;
  participantsTotal: number;
  pendingCount: number;
  acceptedCount: number;
  suggestedCount: number;
  respondedCount: number;
  completionPercentage: number;
  allResponded: boolean;
  participants: DeanReviewParticipant[];
};

export type SuggestionAnalysisResult = {
  responseId: number;
  analysisStatus: "feasible" | "has_conflicts" | "infeasible";
  canApplyDirectly: boolean;
  conflicts: string[];
  warnings: string[];
  protectedMajorImpact: boolean;
  analyzedAt: string;
};

export type RegistrarSuggestionItem = {
  responseId: number;
  instructorId: number;
  instructorName: string;
  status: InstructorReviewStatus;
  reason: string | null;
  deanDecisionNote: string | null;
  deanReviewedAt: string | null;
  registrarDecisionNote: string | null;
  registrarReviewedAt: string | null;
  respondedAt: string | null;
  currentSchedule: {
    scheduleId: number;
    subjectId: number;
    subjectCode: string | null;
    subjectTitle: string | null;
    dayOfWeek: string | null;
    startTime: string | null;
    endTime: string | null;
    roomId: number | null;
    roomName: string | null;
    isProtected: boolean;
  } | null;
  moves: SuggestionMove[];
  proposedMeetings: ProposedMeeting[];
};

export type RegistrarRevisionWorkspace = {
  release: ScheduleRelease;
  suggestions: RegistrarSuggestionItem[];
  unresolvedCount: number;
  resolvedCount: number;
};

export type SuggestionSlot = {
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  roomId: number | null;
  roomName: string | null;
  roomType: string | null;
};

export type SuggestionMove = {
  scheduleId: number;
  subjectId: number | null;
  subjectCode: string | null;
  subjectTitle: string | null;
  subjectType: string | null;
  programAbbrev: string | null;
  yearLevel: number | null;
  setCode: string | null;
  sessionMode: "LEC" | "LAB" | null;
  classMode: string | null;
  isProtected: boolean;
  original: SuggestionSlot;
  proposed: SuggestionSlot;
  changed: boolean;
};

export type AdvancedConflict = {
  scheduleId: number;
  subjectCode: string | null;
  isProtected: boolean;
};

export type AdjustmentMove = {
  scheduleId: number;
  subjectCode: string | null;
  isProtected: boolean;
  current: { day: string; start: string; end: string; roomId: number | null };
  proposed: { day: string; start: string; end: string; roomId: number | null };
  reason: string;
};

export type AdvancedTargetSuggestion = {
  responseId: number;
  instructorId: number;
  setId: number;
  subjectId: number;
  currentDay: string | null;
  currentStart: string | null;
  currentEnd: string | null;
  currentRoomId: number | null;
  proposedMeetings: ProposedMeeting[];
};

export type AdvancedAnalysisStatus =
  | "directly_feasible"
  | "feasible_with_unprotected_adjustments"
  | "requires_protected_major_reconsideration"
  | "infeasible";

export type AffectedInstructorResponseState =
  | "accepted_schedule"
  | "accepted_release"
  | "suggestion_submitted"
  | "suggestion_submitted_elsewhere"
  | "awaiting_response"
  | "not_distributed"
  | "unassigned";

export type AffectedSchedule = {
  scheduleId: number;
  subjectId: number;
  subjectCode: string | null;
  subjectTitle: string | null;
  programAbbrev: string | null;
  yearLevel: number | null;
  setCode: string | null;
  instructorId: number | null;
  instructorName: string;
  classMode: string;
  sessionMode: "LEC" | "LAB" | null;
  isProtected: boolean;
  impact: "blocks_proposal" | "relocation_required";
  conflictTypes: Array<"room" | "section" | "instructor">;
  conflictingProposedMeetings: Array<{
    day: string;
    start: string;
    end: string;
    roomId: number | null;
    conflictTypes: Array<"room" | "section" | "instructor">;
  }>;
  current: {
    day: string | null;
    start: string | null;
    end: string | null;
    roomId: number | null;
    roomName: string | null;
  };
  proposed: {
    day: string;
    start: string;
    end: string;
    roomId: number | null;
    roomName: string | null;
  } | null;
  release: {
    releaseId: number | null;
    status: string | null;
  };
  instructorResponse: {
    state: AffectedInstructorResponseState;
    label: string;
    acceptedSchedule: boolean;
    suggestionForThisSubject: boolean;
    responseId: number | null;
    responseType: InstructorReviewResponseType | null;
    responseStatus: InstructorReviewStatus | null;
    respondedAt: string | null;
    reason: string | null;
  };
  isDirectConflict: boolean;
};

export type DirectApplyBlock = {
  headline: string;
  summary: string;
  nextStep: string;
  affectedCount: number;
  conflictCount: number;
};

export type AdvancedAnalysisResult = {
  responseId: number;
  analysisStatus: AdvancedAnalysisStatus;
  canApplyDirectly: boolean;
  requiresProtectedAuthority: boolean;
  targetSuggestion: AdvancedTargetSuggestion | Record<string, never>;
  conflicts: AdvancedConflict[];
  adjustments: AdjustmentMove[];
  protectedMajorImpact: AdjustmentMove[];
  affectedSchedules: AffectedSchedule[];
  directApplyBlock: DirectApplyBlock | null;
  warnings: string[];
  infeasibleReasons: string[];
  analysisToken: string;
  analyzedAt: string;
};

export type RetentionDecisionPreview = {
  responseId: number;
  analysisStatus: AdvancedAnalysisStatus;
  headline: string;
  summary: string;
  reasonDetails: string[];
  suggestedReason: string;
  affectedSchedules: AffectedSchedule[];
  analyzedAt: string;
};
