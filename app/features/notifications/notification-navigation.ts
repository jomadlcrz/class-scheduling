import type { NotificationItem, NotificationPayload } from "~/types/notification";

/**
 * Deep link to the section a schedule notification points at. The regular-class
 * builder reads ?sy&sem&program&yl&set (see routes/app/schedules/regular-class),
 * so a click can land the registrar straight on the returned section.
 */
function regularClassPath(p: NotificationPayload): string {
  const sy = p.school_year;
  const sem = p.semester_number;
  const program = p.program_abbrev;
  const yearLevel = p.year_level;
  const setCode = p.set_code;
  if (!sy || sem == null || !program || yearLevel == null || !setCode) {
    return "/schedules/regular-class";
  }
  // The grid filters on the derived set label (BSIT-3A), not the bare set code —
  // Set.set_name is f"{program_abbrev}-{year_level}{set_code.upper()}".
  const set = setCode.includes("-") ? setCode : `${program}-${yearLevel}${setCode.toUpperCase()}`;
  const search = new URLSearchParams({ sy, sem: String(sem), program, yl: String(yearLevel), set });
  return `/schedules/regular-class?${search.toString()}`;
}

/** Where a notification click should land — null means mark read only, no navigation. */
export function resolveNotificationTarget(
  notification: NotificationItem,
  role: string | undefined,
): string | null {
  const p = notification.payload ?? {};

  switch (notification.type) {
    case "schedule_approval_rejected":
    case "schedule_approval_rejected_summary":
      // Registrar: the dean returned this schedule — open the section to revise and resubmit.
      return regularClassPath(p);
    case "schedule_approval_requested": {
      // Dean: land on the purpose-built approval detail page for this release when we have its id.
      const releaseId = p.release_id;
      return typeof releaseId === "number"
        ? `/dean/department-schedules/${releaseId}`
        : "/dean/department-schedules";
    }
    case "schedule_approval_requested_summary":
      return "/dean/department-schedules";
    case "schedule_published_summary":
    case "schedule_rescheduled_summary":
      return "/dean/department-schedules";
    case "major_schedule_submitted":
    case "major_schedule_edit_requested":
    case "major_schedule_edit_approved":
    case "major_schedule_edit_rejected":
    case "major_schedule_deleted":
    case "major_schedule_reopened":
    case "major_schedule_finalized":
      return "/major-schedules";
    case "schedule_approval_approved":
    case "schedule_approval_approved_summary":
      return role === "dean" ? "/dean/department-schedules" : "/schedules";
    case "schedule_approval_returned_for_revision_summary":
      return role === "registrar" ? "/schedules/regular-class" : "/dean/department-schedules";
    case "schedule_review_distributed":
      return role === "faculty" ? "/schedule-responses" : "/dean/department-schedules";
    case "scheduling_deadline_updated":
    case "scheduling_phase_changed":
    case "major_scheduling_window_opened":
    case "major_scheduling_window_closed":
    case "suggestion_window_opened":
    case "suggestion_window_closed":
      return role === "registrar"
        ? "/schedules/term-calendar"
        : role === "dean"
          ? "/dean/department-schedules"
          : "/schedule-responses";
    case "instructor_schedule_response":
    case "instructor_suggestion_rejected":
    case "suggestion_resolution_granted":
      return "/schedule-responses";
    case "suggestion_resolution_summary":
      return role === "registrar" ? "/schedules/term-calendar" : "/schedule-responses";
    case "subject_offering_updated":
      return "/subject-offering";
    case "schedule_published":
    case "schedule_rescheduled":
      return role === "student" ? "/student-schedule" : "/faculty-schedule";
    case "subject_assignment_changed":
      return "/faculty-schedule";
    case "student_enrolled":
      return "/student-schedule";
    case "account_reactivated":
      return "/dashboard";
    default:
      return null;
  }
}
