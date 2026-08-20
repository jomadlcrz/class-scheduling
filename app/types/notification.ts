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
  | "schedule_approval_requested"
  | "schedule_approval_rejected"
  | "major_schedule_submitted"
  | "major_schedule_edit_requested"
  | "major_schedule_deleted"
  | "subject_assignment_changed"
  | "student_enrolled"
  | "account_reactivated";

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
  semester?: string | null;
  semester_number?: number | null;
  school_year?: string | null;
  session_count?: number;
  sessions?: NotificationSession[];
  subject_code?: string | null;
  subject_codes?: string[];
  action?: "added" | "removed";
  release_id?: number;
  set_id?: number;
  old?: NotificationTimeBlock;
  new?: NotificationTimeBlock;
  submission_note?: string | null;
  rejection_reason?: string | null;
  reason?: string | null;
  department_abbrev?: string | null;
  department_name?: string | null;
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
  notifications: NotificationItem[];
};
