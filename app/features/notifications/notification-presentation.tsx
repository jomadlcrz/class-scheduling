import type { ReactNode } from "react";
import {
  AlertTriangleIcon,
  BookIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  CalendarClockIcon,
  CalendarShuffleIcon,
  CheckIcon,
  ClipboardIcon,
  CloseIcon,
  ClockIcon,
  GraduationCapIcon,
  LayersIcon,
  ListIcon,
  MonitorIcon,
  RefreshCwIcon,
  RotateIcon,
  SendIcon,
  TrashIcon,
  UserCheckIcon,
} from "~/components/ui/icons";
import { formatDeadline } from "~/features/term-scheduling/term-scheduling-display";
import { programSetLabel } from "~/lib/section-label";
import type { NotificationItem, NotificationPayload } from "~/types/notification";

/**
 * Whether this notification is a job or a fact.
 */
export type NotificationIntent = "action" | "update";

export type NotificationTone = "sky" | "rose" | "emerald" | "amber" | "violet" | "slate";


export type NotificationPresentation = {
  intent: NotificationIntent;
  tone: NotificationTone;
  icon: ReactNode;
  title: string;
  meta: string;
  body?: string | null;
  cta?: string;
};

export const NOTIFICATION_TONE_STYLES: Record<
  NotificationTone,
  { rail: string; icon: string; surface: string }
> = {
  sky: {
    rail: "bg-sky-400 dark:bg-sky-400/70",
    icon: "text-sky-700 dark:text-sky-300",
    surface: "bg-sky-50/70 dark:bg-sky-400/8",
  },
  rose: {
    rail: "bg-rose-400 dark:bg-rose-400/70",
    icon: "text-rose-700 dark:text-rose-300",
    surface: "bg-rose-50/70 dark:bg-rose-400/8",
  },
  emerald: {
    rail: "bg-emerald-400 dark:bg-emerald-400/70",
    icon: "text-emerald-700 dark:text-emerald-300",
    surface: "bg-emerald-50/70 dark:bg-emerald-400/8",
  },
  amber: {
    rail: "bg-amber-400 dark:bg-amber-400/70",
    icon: "text-amber-700 dark:text-gold-300",
    surface: "bg-amber-50/70 dark:bg-amber-400/8",
  },
  violet: {
    rail: "bg-violet-400 dark:bg-violet-400/70",
    icon: "text-violet-700 dark:text-violet-300",
    surface: "bg-violet-50/70 dark:bg-violet-400/8",
  },
  slate: {
    rail: "bg-slate-300 dark:bg-white/20",
    icon: "text-slate-500 dark:text-slate-400",
    surface: "bg-slate-50 dark:bg-white/5",
  },
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function join(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" · ");
}

/** Title, body, icon and intent for one notification. */
export function presentNotification(notification: NotificationItem): NotificationPresentation {
  const p = notification.payload ?? {};
  const label = programSetLabel(p.program_abbrev ?? null, p.year_level ?? null, p.set_code ?? null);
  const period = join([p.semester as string, p.school_year as string]);

  switch (notification.type) {
    case "schedule_approval_requested": {
      const count = typeof p.session_count === "number" ? p.session_count : 0;
      return {
        intent: "action",
        tone: "sky",
        icon: <ClipboardIcon />,
        title: label ? `${label} is waiting for your review` : "A schedule is waiting for your review",
        meta: join([count > 0 ? `${count} session${count === 1 ? "" : "s"}` : null, period]),
        body: text(p.submission_note),
        cta: "Review it",
      };
    }
    case "schedule_approval_requested_summary": {
      const setCount = typeof p.set_count === "number" ? p.set_count : 0;
      const program = text(p.program_abbrev);
      return {
        intent: "action",
        tone: "sky",
        icon: <ClipboardIcon />,
        title: program
          ? `${setCount} section${setCount === 1 ? "" : "s"} in ${program} ${
              setCount === 1 ? "is" : "are"
            } waiting for your review`
          : "Sections are waiting for your review",
        meta: period,
        body: text(p.submission_note),
        cta: "Review it",
      };
    }
    case "schedule_approval_rejected":
      return {
        intent: "action",
        tone: "rose",
        icon: <RotateIcon />,
        title: label ? `${label} was returned by the dean` : "A schedule was returned by the dean",
        meta: period,
        body: text(p.rejection_reason),
        cta: "Revise and resubmit",
      };
    case "schedule_approval_rejected_summary": {
      const setCount = typeof p.set_count === "number" ? p.set_count : 0;
      const program = text(p.program_abbrev);
      return {
        intent: "action",
        tone: "rose",
        icon: <RotateIcon />,
        title: program
          ? `${setCount} section${setCount === 1 ? "" : "s"} in ${program} ${
              setCount === 1 ? "was" : "were"
            } returned by the dean`
          : "Sections were returned by the dean",
        meta: period,
        body: text(p.rejection_reason),
        cta: "Revise and resubmit",
      };
    }
    case "major_schedule_edit_requested": {
      const department = text(p.department_abbrev) || text(p.department_name);
      return {
        intent: "action",
        tone: "amber",
        icon: <AlertTriangleIcon />,
        title: department
          ? `The registrar asked ${department} to edit its major schedules`
          : "The registrar asked for an edit to major schedules",
        meta: period,
        body: text(p.reason),
        cta: "Open major scheduling",
      };
    }
    case "major_schedule_edit_approved":
      return {
        intent: "action",
        tone: "emerald",
        icon: <CheckIcon />,
        title: "Your request to edit has been approved",
        meta: period,
        body: text(p.decision_note),
        cta: "Open major scheduling",
      };
    case "major_schedule_edit_rejected":
      return {
        intent: "update",
        tone: "rose",
        icon: <CloseIcon />,
        title: "Your request to edit was declined",
        meta: period,
        body: text(p.decision_note) || text(p.reason),
      };
    case "major_schedule_reopened": {
      const department = text(p.department_abbrev) || text(p.department_name);
      return {
        intent: "action",
        tone: "amber",
        icon: <RefreshCwIcon />,
        title: department
          ? `Major scheduling reopened for ${department}`
          : "Major scheduling reopened",
        meta: period,
        body: "Dean and instructor review downstream of these majors was cleared and has to be done again.",
        cta: "Open major scheduling",
      };
    }
    case "major_schedule_finalized": {
      const department = text(p.department_abbrev) || text(p.department_name);
      const count = typeof p.session_count === "number" ? p.session_count : 0;
      return {
        intent: "update",
        tone: "emerald",
        icon: <CheckIcon />,
        title: department
          ? `Major schedules finalized for ${department}`
          : "Major schedules finalized",
        meta: join([count > 0 ? `${count} meeting${count === 1 ? "" : "s"}` : null, period]),
        body: "These meetings are now locked in as protected constraints.",
      };
    }
    case "major_schedule_submitted": {
      const count = typeof p.session_count === "number" ? p.session_count : 0;
      const department = text(p.department_abbrev) || text(p.department_name);
      return {
        intent: "action",
        tone: "sky",
        icon: <LayersIcon />,
        title: department
          ? `${department} submitted its major schedules`
          : "Major schedules were submitted",
        meta: join([
          count > 0 ? `${count} meeting${count === 1 ? "" : "s"}` : null,
          typeof p.version === "number" ? `Version ${p.version}` : null,
          period,
        ]),
        cta: "Review the majors",
      };
    }

    case "schedule_approval_approved": {
      const count = typeof p.session_count === "number" ? p.session_count : 0;
      return {
        intent: "update",
        tone: "emerald",
        icon: <CheckIcon />,
        title: label ? `${label} was approved` : "A schedule was approved by the dean",
        meta: join([count > 0 ? `${count} session${count === 1 ? "" : "s"}` : null, period]),
      };
    }
    case "schedule_approval_approved_summary": {
      const setCount = typeof p.set_count === "number" ? p.set_count : 0;
      const sessionCount = typeof p.session_count === "number" ? p.session_count : 0;
      const program = text(p.program_abbrev);
      return {
        intent: "update",
        tone: "emerald",
        icon: <CheckIcon />,
        title: program
          ? `${setCount} section${setCount === 1 ? "" : "s"} in ${program} ${
              setCount === 1 ? "was" : "were"
            } approved`
          : "Sections were approved by the dean",
        meta: join([
          sessionCount > 0 ? `${sessionCount} session${sessionCount === 1 ? "" : "s"}` : null,
          period,
        ]),
      };
    }
    case "schedule_approval_returned_for_revision_summary": {
      const setCount = typeof p.set_count === "number" ? p.set_count : 0;
      const program = text(p.program_abbrev);
      return {
        intent: "action",
        tone: "rose",
        icon: <RotateIcon />,
        title: program
          ? `${setCount} section${setCount === 1 ? "" : "s"} in ${program} ${
              setCount === 1 ? "was" : "were"
            } sent back for revision`
          : "Sections were sent back for revision",
        meta: period,
        body: text(p.reason),
        cta: "Revise and resubmit",
      };
    }
    case "schedule_published": {
      const count = Array.isArray(p.sessions)
        ? p.sessions.length
        : typeof p.session_count === "number"
          ? p.session_count
          : 0;
      return {
        intent: "update",
        tone: "emerald",
        icon: <SendIcon />,
        title: label ? `Schedule published for ${label}` : "Schedule published",
        meta: join([count > 0 ? `${count} session${count === 1 ? "" : "s"}` : null, period]),
      };
    }
    case "schedule_published_summary": {
      const setCount = typeof p.set_count === "number" ? p.set_count : 0;
      const sessionCount = typeof p.session_count === "number" ? p.session_count : 0;
      const program = text(p.program_abbrev);
      return {
        intent: "update",
        tone: "emerald",
        icon: <SendIcon />,
        title: program
          ? `${setCount} section${setCount === 1 ? "" : "s"} in ${program} ${
              setCount === 1 ? "was" : "were"
            } published`
          : "Sections were published",
        meta: join([
          sessionCount > 0 ? `${sessionCount} session${sessionCount === 1 ? "" : "s"}` : null,
          period,
        ]),
      };
    }
    case "schedule_instructor_changed":
    case "schedule_instructor_changed_summary": {
      if (typeof p.vacated_count === "number") {
        return {
          intent: "update",
          tone: "rose",
          icon: <UserCheckIcon />,
          title:
            p.vacated_count === 1
              ? "You were taken off 1 class this term"
              : `You were taken off ${p.vacated_count} classes this term`,
          body: text(p.reason) ?? undefined,
          meta: period,
        };
      }

      const subject = text(p.subject_code);
      const incoming = text(p.new_instructor);
      const outgoing = text(p.previous_instructor);
      const meetings =
        typeof p.meeting_count === "number" && p.meeting_count > 1
          ? `${p.meeting_count} meetings`
          : null;

      return {
        intent: "update",
        tone: incoming ? "violet" : "amber",
        icon: <UserCheckIcon />,
        title: incoming
          ? `${subject ?? "A class"} is now with ${incoming}`
          : `${subject ?? "A class"} has no instructor`,
        body: text(p.reason) ?? undefined,
        meta: join([
          outgoing ? `was ${outgoing}` : null,
          meetings,
          text(p.set_name) ?? label,
        ]),
      };
    }

    case "schedule_delivery_changed":
    case "schedule_delivery_changed_summary": {
      const subject = text(p.subject_code);
      const mode = text(p.class_mode);
      const previous = text(p.previous_class_mode);

      return {
        intent: "update",
        tone: "sky",
        icon: <MonitorIcon />,
        title: mode
          ? `${subject ?? "A class"} is now ${mode}`
          : `${subject ?? "A class"} changed delivery mode`,
        body: text(p.reason) ?? undefined,
        meta: join([
          previous ? `was ${previous}` : null,
          p.released_room ? "Room released" : text(p.room),
          text(p.set_name) ?? label,
        ]),
      };
    }

    case "schedule_review_distributed":
      return {
        intent: "action",
        tone: "amber",
        icon: <CalendarCheckIcon />,
        title: "A schedule needs your review",
        meta: join([label, period]),
        cta: "Review it",
      };

    case "instructor_availability_declared": {
      type WinRow = { day?: string; start_time?: string; end_time?: string };
      const windows = Array.isArray(p.windows) ? (p.windows as WinRow[]) : [];
      const count = typeof p.window_count === "number" ? p.window_count : windows.length;
      const who = text(p.instructor_name) ?? "An instructor";
      return {
        intent: "action",
        tone: "amber",
        icon: <CalendarClockIcon />,
        cta: "Set their hours",
        title:
          count === 0
            ? `${who} withdrew their availability`
            : p.is_update === true
              ? `${who} changed their availability`
              : `${who} sent you their availability`,
        meta: join([
          text(p.employment_status),
          count > 0 ? `${count} time${count === 1 ? "" : "s"}` : null,
          period,
        ]),
        body:
          text(p.note) ??
          (windows.length > 0
            ? windows
                .slice(0, 3)
                .map((w) => `${w.day ?? ""} ${w.start_time ?? ""}–${w.end_time ?? ""}`.trim())
                .join(" · ")
            : null),
      };
    }

    case "instructor_availability_configured": {
      type WinRow = { day?: string; start_time?: string; end_time?: string };
      const windows = Array.isArray(p.windows) ? (p.windows as WinRow[]) : [];
      return {
        intent: "update",
        tone: p.cleared === true ? "slate" : "emerald",
        icon: <CalendarCheckIcon />,
        title:
          p.cleared === true
            ? "Your availability restriction was lifted"
            : p.matches_declaration === true
              ? "Your dean accepted your availability as you sent it"
              : "Your dean set the hours your schedule will be built within",
        meta: join([
          p.cleared === true ? "You can be scheduled at any teaching hour" : null,
          period,
        ]),
        body:
          text(p.note) ??
          (p.cleared !== true && windows.length > 0
            ? windows.map((w) => `${w.day ?? ""} ${w.start_time ?? ""}–${w.end_time ?? ""}`.trim()).join(" · ")
            : null),
      };
    }

    case "instructor_availability_widen_requested": {
      type WinRow = { day?: string; start_time?: string; end_time?: string };
      const windows = Array.isArray(p.windows) ? (p.windows as WinRow[]) : [];
      const who = text(p.instructor_name) ?? "an instructor";
      return {
        intent: "action",
        tone: "amber",
        icon: <CalendarClockIcon />,
        title: text(p.subject_code)
          ? `The Registrar needs ${who} available for ${text(p.subject_code)}`
          : `The Registrar is asking you to widen ${who}'s hours`,
        cta: "Review the request",
        meta: join([
          windows.map((w) => `${w.day ?? ""} ${w.start_time ?? ""}–${w.end_time ?? ""}`.trim()).join(" · ") || null,
          text(p.requested_by),
          period,
        ]),
        body: text(p.reason),
      };
    }

    case "instructor_availability_widen_decided": {
      type WinRow = { day?: string; start_time?: string; end_time?: string };
      const approved = p.status === "approved";
      const windows = Array.isArray(p.windows) ? (p.windows as WinRow[]) : [];
      const who = text(p.instructor_name) ?? "an instructor";
      return {
        intent: "update",
        tone: approved ? "emerald" : "slate",
        icon: approved ? <CalendarCheckIcon /> : <CloseIcon />,
        title: approved
          ? `${who}'s availability was widened`
          : `Your request to widen ${who}'s availability was declined`,
        meta: join([
          text(p.subject_code),
          text(p.decided_by) ? `Decided by ${text(p.decided_by)}` : null,
          period,
        ]),
        body:
          text(p.decision_message) ??
          (approved && windows.length > 0
            ? `Now available ${windows.map((w) => `${w.day ?? ""} ${w.start_time ?? ""}–${w.end_time ?? ""}`.trim()).join(" · ")}`
            : null),
      };
    }
    case "schedule_rescheduled":
    case "schedule_rescheduled_summary": {
      const block = p.new as NotificationPayload["new"];
      const when = block
        ? join([
            block.day ?? null,
            [block.start_time, block.end_time].filter(Boolean).join("–") || null,
            block.room ?? null,
          ])
        : "";
      return {
        intent: "update",
        tone: "violet",
        icon: <CalendarShuffleIcon />,
        title: p.subject_code ? `${p.subject_code} was moved` : "A session was moved",
        meta: join([when || null, label]),
      };
    }
    case "suggestion_resolution_granted":
      return {
        intent: "update",
        tone: "emerald",
        icon: <CheckIcon />,
        title: text(p.subject_code)
          ? `Your request was granted — ${text(p.subject_code)}`
          : "Your request was granted",
        meta: join([label, period]),
      };
    case "suggestion_resolution_summary": {
      const total = typeof p.total === "number" ? p.total : 0;
      return {
        intent: "update",
        tone: "violet",
        icon: <ListIcon />,
        title: `${total} request${total === 1 ? "" : "s"} in your department ${
          total === 1 ? "was" : "were"
        } resolved`,
        meta: join([
          typeof p.granted === "number" && p.granted > 0 ? `${p.granted} granted` : null,
          typeof p.declined === "number" && p.declined > 0 ? `${p.declined} declined` : null,
          period,
        ]),
      };
    }
    case "instructor_suggestion_rejected":
      return {
        intent: "update",
        tone: "slate",
        icon: <RotateIcon />,
        title: text(p.subject_code)
          ? `Schedule change not applied — ${text(p.subject_code)}`
          : "A schedule change was not applied",
        meta: join([text(p.instructor_name) ? `Suggested by ${text(p.instructor_name)}` : null, period]),
        body: text(p.note),
      };
    case "major_schedule_deleted": {
      const when = [
        text(p.day),
        [p.start_time, p.end_time].filter(Boolean).join("–") || null,
        text(p.room),
      ]
        .filter(Boolean)
        .join(" ");
      return {
        intent: "update",
        tone: "rose",
        icon: <TrashIcon />,
        title: text(p.subject_code)
          ? `The registrar deleted ${text(p.subject_code)}${text(p.set_name) ? ` — ${text(p.set_name)}` : ""}`
          : "The registrar deleted a major meeting",
        meta: join([when || null, period]),
        body: text(p.reason),
      };
    }
    case "subject_assignment_changed": {
      const codes = Array.isArray(p.subject_codes) ? p.subject_codes : [];
      return {
        intent: "update",
        tone: "violet",
        icon: <BookIcon />,
        title:
          p.action === "removed"
            ? "Subjects were removed from your load"
            : "Subjects were added to your load",
        meta: codes.join(", "),
      };
    }
    case "subject_offering_updated": {
      if (p.action === "hours_adjustment_requested") {
        return {
          intent: "action",
          tone: "amber",
          icon: <BriefcaseIcon />,
          title: "A max weekly hours increase needs your approval",
          meta: join([
            text(p.instructor_name),
            typeof p.requested_hours === "number" ? `${p.requested_hours} hrs requested` : null,
            text(p.department_abbrev),
          ]),
          cta: "Decide on it",
        };
      }
      if (p.action === "hours_adjustment_approved" || p.action === "hours_adjustment_rejected") {
        const approved = p.action === "hours_adjustment_approved";
        return {
          intent: "update",
          tone: approved ? "emerald" : "rose",
          icon: <BriefcaseIcon />,
          title: `Your max weekly hours request was ${approved ? "approved" : "declined"}`,
          meta: join([
            text(p.instructor_name),
            typeof p.requested_hours === "number" ? `${p.requested_hours} hrs` : null,
          ]),
          body: text(p.decision_message),
        };
      }
      const codes = Array.isArray(p.subject_codes) ? p.subject_codes.join(", ") : "";
      const department = text(p.department_name) || text(p.department_abbrev) || "the department";
      return {
        intent: "update",
        tone: "violet",
        icon: <BriefcaseIcon />,
        title: `Subject offering ${p.action === "removed" ? "updated" : "assigned"} — ${department}`,
        meta: join([text(p.actor_name) || "Another staff member", text(p.instructor_name), codes || null]),
      };
    }
    case "scheduling_deadline_updated": {
      const changes = Array.isArray(p.changes) ? p.changes : [];
      const reopened = Array.isArray(p.reopened) ? p.reopened : [];
      const moved = changes
        .map((change) => `${change.label ?? "Deadline"}: ${change.previous ?? "unset"} → ${change.next ?? "unset"}`)
        .join(" · ");
      return {
        intent: "update",
        tone: "amber",
        icon: <CalendarClockIcon />,
        title: reopened.length
          ? `${reopened.map((phase) => phase.replace(/_/g, " ")).join(", ")} is open again`
          : "A scheduling deadline moved",
        meta: period,
        body: moved || undefined,
      };
    }
    case "scheduling_phase_changed": {
      const title =
        p.phase === "suggestion_window"
          ? "Major scheduling is closed"
          : p.phase === "major_scheduling"
            ? "Major scheduling is open again"
            : "The term's scheduling phase changed";
      return {
        intent: "update",
        tone: "amber",
        icon: <ClockIcon />,
        title,
        meta: period,
        body:
          p.phase === "resolution"
            ? "If you did not respond, the schedule you were given stands and is now final."
            : undefined,
      };
    }
    case "major_scheduling_window_opened": {
      const closing = text(p.closing_at);
      return {
        intent: "update",
        tone: "violet",
        icon: <ClipboardIcon />,
        title: "Major Scheduling is now open",
        meta: period,
        body: closing
          ? `Submit your department's major schedules before ${formatDeadline(closing)}.`
          : "Submit your department's major schedules.",
      };
    }
    case "major_scheduling_window_closed":
      return {
        intent: "update",
        tone: "slate",
        icon: <ClipboardIcon />,
        title: "Major Scheduling has closed",
        meta: period,
        body:
          "New major-schedule submissions are no longer accepted unless the Registrar " +
          "grants an extension or reopens the window.",
      };
    case "suggestion_window_opened": {
      const closing = text(p.closing_at);
      return {
        intent: "update",
        tone: "amber",
        icon: <CalendarClockIcon />,
        title: "Shift Request Window is now open",
        meta: period,
        body: closing
          ? `Instructors may now accept their assigned schedule or submit a schedule suggestion. Respond before ${formatDeadline(closing)}.`
          : "Instructors may now accept their assigned schedule or submit a schedule suggestion.",
      };
    }
    case "suggestion_window_closed":
      return {
        intent: "update",
        tone: "slate",
        icon: <CalendarClockIcon />,
        title: "Shift Request Window has closed",
        meta: period,
        body: "Instructor responses are no longer being accepted for this academic term.",
      };
    case "instructor_schedule_response":
      return {
        intent: "update",
        tone: "slate",
        icon: <UserCheckIcon />,
        title: label
          ? `An instructor ${p.response_type === "accept" ? "accepted" : "suggested a change to"} ${label}`
          : `An instructor ${p.response_type === "accept" ? "accepted" : "suggested a change to"} their schedule`,
        meta: period,
      };
    case "student_enrolled":
      return {
        intent: "update",
        tone: "emerald",
        icon: <GraduationCapIcon />,
        title: "You've been enrolled",
        meta: period,
      };
    case "account_reactivated":
      return {
        intent: "update",
        tone: "emerald",
        icon: <UserCheckIcon />,
        title: "Your account was reactivated",
        meta: "",
      };
    default:
      return {
        intent: "update",
        tone: "slate",
        icon: <ClockIcon />,
        title: "Notification",
        meta: "",
      };
  }
}
