export type AssignmentAuditLog = {
  id: number;
  action: string;
  actionLabel: string;
  teachingTermId: number | null;
  departmentId: number | null;
  departmentName: string | null;
  instructorProfileId: number | null;
  instructorName: string | null;
  syId: number | null;
  schoolYear: string | null;
  semesterNumber: number | null;
  subjectId: number | null;
  subjectCode: string | null;
  previousValue: string | null;
  newValue: string | null;
  performerName: string | null;
  role: string | null;
  details: string | null;
  createdAt: string;
};

export type WorkflowIdentity = {
  user_id: number | null;
  name: string | null;
  role: string | null;
  email: string | null;
};

export type HoursAdjustmentRequest = {
  id: number;
  teaching_term_id: number;
  requested_hours: number;
  previous_hours: number | null;
  reason: string;
  status: string;
  decision_message: string | null;
  requested_by: WorkflowIdentity;
  decided_by: WorkflowIdentity | null;
  created_at: string | null;
  decided_at: string | null;
  instructor: {
    instructor_profile_id: number;
    full_name: string;
    department_id: number | null;
    department_abbrev: string | null;
  };
  term: {
    sy_id: number;
    semester_number: number;
    current_max_weekly_hours: number;
  };
};

export type MajorScheduleMeetingInput = {
  syId: number;
  semesterNumber: number;
  programId: number;
  setId: number;
  subjectId: number;
  instructorId?: number | null;
  roomId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  mode?: string;
  overrideMeetingPattern?: boolean;
};

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
  subjectType: string;
  meetingKind: "LAB" | "LEC";
  instructorId: number | null;
  instructorDisplay: string;
  floating: boolean;
  roomId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  workflowStatus: string;
  isDraft: boolean;
  protected: boolean;
  submissionId: number;
  departmentAbbrev: string | null;
  departmentName: string | null;
};

export type MajorScheduleEditHistory = {
  id: number;
  status: string;
  reason: string;
  requestedAt: string;
  reviewedAt: string | null;
  decisionNote: string | null;
};

export type MajorScheduleSubmission = {
  id: number;
  departmentId: number;
  departmentName: string;
  departmentAbbrev: string;
  syId: number;
  semesterNumber: number;
  version: number;
  status: string;
  submittedAt: string | null;
  finalizedAt: string | null;
  editRequestStatus: string | null;
  editRequestHistory: MajorScheduleEditHistory[];
  deletionNotes?: MajorScheduleDeletionNote[];
  schedules: MajorSchedule[];
};

export type MajorScheduleDeletionNote = {
  id: number;
  scheduleId: number;
  reason: string;
  subjectCode: string | null;
  subjectTitle: string | null;
  programAbbrev: string | null;
  setName: string | null;
  roomName: string | null;
  instructorDisplay: string | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  deletedBy: string | null;
  deletedAt: string;
};

export type MajorScheduleRequirement = {
  setId: number;
  setName: string;
  subjectId: number;
  subjectCode: string;
  subjectTitle: string;
  subjectType: string;
  requiredMeetingKinds: string[];
  satisfiedMeetingKinds: string[];
  missingMeetingKinds: string[];
  isSatisfied: boolean;
  canCreateAdjustment: boolean;
  assignedInstructors: Array<{ instructorId: number; displayName: string }>;
};

export type MajorScheduleRequirements = {
  submissionId: number;
  departmentId: number;
  syId: number;
  semesterNumber: number;
  status: string;
  requirements: MajorScheduleRequirement[];
  unsatisfiedCount: number;
};

export type MajorScheduleAuditLog = {
  id: number;
  action: string;
  actionLabel: string;
  workspace: "dean" | "registrar";
  submissionId: number | null;
  submissionVersion: number | null;
  departmentAbbrev: string | null;
  departmentName: string | null;
  subjectLabel: string | null;
  setName: string | null;
  performedBy: { userId: number | null; name: string | null; role: string | null };
  reason: string | null;
  details: string | null;
  createdAt: string | null;
};

export type MajorScheduleAuditLogResult = {
  items: MajorScheduleAuditLog[];
  actions: Array<{ value: string; label: string }>;
  pagination: { page: number; perPage: number; total: number; pages: number };
};

export type MajorScheduleEditRequest = {
  id: number;
  submissionId: number;
  departmentId: number;
  syId: number;
  semesterNumber: number;
  reason: string;
  status: string;
  decisionNote: string | null;
  requestedAt: string;
  reviewedAt: string | null;
};

export type MajorScheduleConflict = {
  scheduleId: number;
  conflictingScheduleId: number;
  roomConflict: boolean;
  sectionConflict: boolean;
  instructorConflict: boolean;
  conflictTypes: string[];
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  schedule: MajorSchedule;
  conflictingSchedule: MajorSchedule;
};

export type ProposedScheduleMeeting = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: number;
};

export type InstructorScheduleResponse = {
  id: number;
  scheduleId: number;
  instructorId: number;
  instructorName: string;
  subjectId: number | null;
  subjectCode: string | null;
  setId: number | null;
  departmentId: number | null;
  responseType: "accept" | "suggest_change";
  status: string;
  reason: string | null;
  deanDecisionNote: string | null;
  registrarDecisionNote: string | null;
  createdAt: string;
  respondedAt: string | null;
  meetings: ProposedScheduleMeeting[];
};

export type InstructorScheduleReviewSummary = {
  releaseId: number;
  syId: number;
  schoolYear: string;
  semesterNumber: number;
  setId: number;
  setCode: string;
  programAbbrev: string | null;
  status: string;
  responseType: "accept" | "suggest_change" | null;
  respondedAt: string | null;
  meetingCount: number;
};

export type InstructorScheduleReviewMeeting = {
  scheduleId: number;
  subjectId: number;
  subjectCode: string;
  subjectTitle: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: number;
  roomName: string | null;
  mode: string;
};

export type InstructorScheduleReviewDetail = {
  releaseId: number;
  syId: number;
  schoolYear: string;
  semesterNumber: number;
  setId: number;
  setCode: string;
  programAbbrev: string | null;
  responseType: "accept" | "suggest_change" | null;
  status: string;
  respondedAt: string | null;
  reason: string | null;
  meetings: InstructorScheduleReviewMeeting[];
  proposedMeetings: ProposedScheduleMeeting[];
};

export type SuggestionDryRunAnalysis = {
  responseId: number;
  feasible: boolean;
  conflicts: string[];
  message: string;
};

export type AdvancedAnalysisResult = {
  responseId: number;
  level: number;
  levelName: string;
  feasible: boolean;
  proposedMeetings: ProposedScheduleMeeting[];
  adjustments?: Array<{
    scheduleId: number;
    subjectCode: string;
    previous: { dayOfWeek: string; startTime: string; endTime: string; roomId: number };
    proposed: { dayOfWeek: string; startTime: string; endTime: string; roomId: number };
  }>;
  conflicts?: string[];
  message?: string;
};
