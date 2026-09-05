import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";

export type CalendarStatus = "Ongoing" | "Ended" | "Upcoming";
export type TermStatus = "Open" | "Closed";

export function calendarStatusTone(status: CalendarStatus | string | null | undefined): BadgeTone {
  switch (status) {
    case "Ongoing":
      return "emerald";
    case "Ended":
      return "slate";
    case "Upcoming":
      return "sky";
    default:
      return "slate";
  }
}

export function termStatusTone(status: TermStatus | string): BadgeTone {
  return status === "Open" ? "emerald" : "gold";
}

/** Accepts API reason code or display label. */
export function closedReasonTone(reason: string | null | undefined): BadgeTone {
  if (!reason) return "slate";
  const normalized = reason.toLowerCase();
  if (normalized.includes("year ended") || normalized === "school_year_ended") return "slate";
  return "gold";
}

export type ScheduleReleaseStatusValue =
  | "draft"
  | "pending_dean_review"
  | "instructor_review"
  | "registrar_revision"
  | "pending_final_approval"
  | "pending_publication"
  | "approved"
  | "rejected";

export function scheduleReleaseStatusTone(status: ScheduleReleaseStatusValue | string): BadgeTone {
  switch (status) {
    case "draft":
      return "gold";
    case "pending_dean_review":
      return "sky";
    case "instructor_review":
      return "violet";
    case "registrar_revision":
      return "gold";
    case "pending_final_approval":
      return "navy";
    case "pending_publication":
      return "navy";
    case "approved":
      return "emerald";
    case "rejected":
      return "red";
    default:
      return "slate";
  }
}

export function scheduleReleaseStatusLabel(status: ScheduleReleaseStatusValue | string): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending_dean_review":
      return "Pending dean review";
    case "instructor_review":
      return "Instructor review";
    case "registrar_revision":
      return "Registrar revision";
    case "pending_final_approval":
      return "Pending final approval";
    case "pending_publication":
      return "Awaiting term publication";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export function StatusBadge({
  tone,
  children,
  icon,
}: {
  tone: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Badge tone={tone}>
      <span className="inline-flex items-center gap-1">
        {icon}
        {children}
      </span>
    </Badge>
  );
}
