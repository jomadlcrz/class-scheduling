import type { Role } from "~/types/user";

/**
 * Notification vocabulary mirrors the backend's NotificationType enum
 * (app/enums.py) and the payload shapes NotificationService builds per event.
 * The bell only makes sense for roles the backend ever notifies.
 */
export const NOTIFICATION_RECIPIENT_ROLES: Role[] = ["registrar", "dean", "faculty", "student"];

export type NotificationType =
  | "schedule_published"
  | "schedule_published_summary"
  | "schedule_rescheduled"
  | "schedule_rescheduled_summary"
  | "schedule_instructor_changed"
  | "schedule_instructor_changed_summary"
  | "schedule_delivery_changed"
  | "schedule_delivery_changed_summary"
  | "schedule_approval_requested"
  | "schedule_approval_requested_summary"
  | "schedule_approval_rejected"
  | "schedule_approval_rejected_summary"
  | "schedule_approval_approved"
  | "schedule_approval_approved_summary"
  | "schedule_approval_returned_for_revision_summary"
  | "major_schedule_submitted"
  | "major_schedule_edit_requested"
  | "major_schedule_edit_approved"
  | "major_schedule_edit_rejected"
  | "major_schedule_reopened"
  | "major_schedule_finalized"
  | "major_schedule_deleted"
  | "subject_assignment_changed"
  | "subject_offering_updated"
  | "student_enrolled"
  | "account_reactivated"
  | "schedule_review_distributed"
  | "scheduling_deadline_updated"
  | "scheduling_phase_changed"
  | "instructor_schedule_response"
  | "instructor_suggestion_rejected"
  | "suggestion_resolution_granted"
  | "suggestion_resolution_summary"
  | "instructor_availability_declared"
  | "instructor_availability_configured"
  | "instructor_availability_widen_requested"
  | "instructor_availability_widen_decided"
  | "major_scheduling_window_opened"
  | "major_scheduling_window_closed"
  | "suggestion_window_opened"
  | "suggestion_window_closed";

type NotificationSession = {
  subject_code?: string | null;
  day?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  room?: string | null;
};

type NotificationTimeBlock = {
  day?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  room?: string | null;
};

/** The backend stores each type's own JSON shape in `payload`; only the common keys are typed. */
export type NotificationPayload = Record<string, unknown> & {
  program_abbrev?: string | null;
  year_level?: number | null;
  set_code?: string | null;
  set_count?: number;
  sets?: Array<{ set_id?: number; set_code?: string | null; year_level?: number | null }>;
  release_id?: number;
  release_ids?: number[];
  set_id?: number;
  semester?: string | null;
  semester_number?: number | null;
  school_year?: string | null;
  session_count?: number;
  sessions?: NotificationSession[];
  subject_code?: string | null;
  subject_codes?: string[];
  action?: "added" | "removed" | string;
  old?: NotificationTimeBlock;
  new?: NotificationTimeBlock;
  submission_note?: string | null;
  submission_id?: number;
  rejection_reason?: string | null;
  reason?: string | null;
  decision_note?: string | null;
  decision_message?: string | null;
  edit_request_id?: number;
  request_id?: number;
  instructor_name?: string | null;
  instructor_profile_id?: number;
  status?: string;
  meetings?: NotificationTimeBlock[];
  meeting_count?: number;
  previous_instructor?: string | null;
  new_instructor?: string | null;
  vacated_count?: number;
  previous_class_mode?: string | null;
  class_mode?: string | null;
  released_room?: boolean;
  version?: number;
  department_abbrev?: string | null;
  department_name?: string | null;
  headline?: string | null;
  detail?: string | null;
  phase?: string;
  window?: "major" | "suggestion";
  closing_at?: string | null;
  changes?: Array<{ key: string; label: string; previous: string | null; next: string | null }>;
  effects?: Array<{ type: string; phase?: string; [key: string]: unknown }>;
  warnings?: string[];
};

export type NotificationItem = {
  id: number;
  type: NotificationType;
  payload: NotificationPayload;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

/** GET /notifications response, mapped to camelCase. */
export type NotificationInbox = {
  unreadCount: number;
  total?: number;
  page?: number;
  perPage?: number;
  hasMore?: boolean;
  notifications: NotificationItem[];
};
