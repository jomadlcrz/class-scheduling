export type ScheduleReleaseStatus = "draft" | "pending_approval" | "approved" | "rejected";

export type ScheduleReleaseSubmitter = { userId: number; name: string | null };

/** Shared release object returned by both the registrar and dean endpoints. */
export type ScheduleRelease = {
  id: number;
  syId: number;
  semesterNumber: number;
  setId: number;
  setCode: string | null;
  yearLevel: number | null;
  programId: number;
  programAbbrev: string | null;
  releaseStatus: ScheduleReleaseStatus;
  sessionCount: number;
  submittedAt: string | null;
  submittedBy: ScheduleReleaseSubmitter | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
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
  pending: ScheduleRelease[];
  recentlyReviewed: ScheduleRelease[];
};
