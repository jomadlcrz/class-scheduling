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
  schedules: MajorSchedule[];
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
  meetings: ProposedScheduleMeeting[];
};
