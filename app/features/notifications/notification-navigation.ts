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
      // Registrar: the dean returned this schedule — open the section to revise and resubmit.
      return regularClassPath(p);
    case "schedule_approval_requested": {
      // Dean: land on the purpose-built approval detail page for this release when we have its id.
      const releaseId = p.release_id;
      return typeof releaseId === "number"
        ? `/dean/schedule-approvals/${releaseId}`
        : "/dean/schedule-approvals";
    }
    case "schedule_published_summary":
    case "schedule_rescheduled_summary":
      return "/dean/schedule-approvals";
    case "major_schedule_submitted":
    case "major_schedule_edit_requested":
    case "major_schedule_deleted":
      return "/major-schedules";
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
