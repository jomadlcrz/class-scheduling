import type { ScheduleReleaseStatus } from "~/types/schedule-release";

export type StatusCounts = Record<ScheduleReleaseStatus, number>;

export function emptyStatusCounts(): StatusCounts {
  return {
    draft: 0,
    pending_dean_review: 0,
    instructor_review: 0,
    registrar_revision: 0,
    pending_final_approval: 0,
    approved: 0,
    rejected: 0,
  };
}

/** Roll a flat list of release statuses into per-status counts. */
export function tallyStatuses(statuses: ScheduleReleaseStatus[]): StatusCounts {
  const counts = emptyStatusCounts();
  for (const status of statuses) counts[status] += 1;
  return counts;
}

/** Accent tone — hue signals workflow state only (your move / waiting / done / info). */
export type HubTone = "action" | "wait" | "done" | "info";

export type HubStage = {
  tone: HubTone;
  eyebrow: string;
  title: string;
  line: string;
  actionLabel: string;
  to: string;
};

export type HubStageInput = {
  hasTerm: boolean;
  total: number;
  unscheduled: number;
  counts: StatusCounts;
};

/** All built sections are approved (and at least one exists). */
export function allApproved(total: number, counts: StatusCounts): boolean {
  return total > 0 && counts.approved === total;
}

/**
 * Derive the single most important next step for the selected term. Ordered by where the
 * work actually blocks: no term → no sections → unscheduled → rejected → drafts → waiting →
 * done. Everything is computed from real term data (sets + release statuses).
 */
export function deriveHubStage({ hasTerm, total, unscheduled, counts }: HubStageInput): HubStage {
  if (!hasTerm) {
    return {
      tone: "info",
      eyebrow: "Start here",
      title: "Set up an academic term",
      line: "Pick a school year and semester above — or open Academic Terms to create one — before building timetables.",
      actionLabel: "Open Academic Terms",
      to: "/academic-terms",
    };
  }
  if (total === 0) {
    return {
      tone: "action",
      eyebrow: "Your next step",
      title: "Create sections for this term",
      line: "No sections exist yet. Add program sections so schedules can be generated for them.",
      actionLabel: "Create sections",
      to: "/sets",
    };
  }
  if (unscheduled > 0) {
    return {
      tone: "action",
      eyebrow: "Your next step",
      title: `Generate schedules for ${unscheduled} section${unscheduled === 1 ? "" : "s"}`,
      line: `${unscheduled} of ${total} section${total === 1 ? "" : "s"} still have no timetable. Build them from the section schedules screen.`,
      actionLabel: "Generate schedules",
      to: "/schedules/regular-class",
    };
  }
  if (counts.rejected > 0) {
    return {
      tone: "action",
      eyebrow: "Needs changes",
      title: `Revise ${counts.rejected} rejected section${counts.rejected === 1 ? "" : "s"}`,
      line: "The dean sent these back. Adjust the timetables and resubmit them for approval.",
      actionLabel: "Review rejected",
      to: "/schedules/regular-class",
    };
  }
  if (counts.draft > 0) {
    return {
      tone: "action",
      eyebrow: "Your next step",
      title: `Prepare ${counts.draft} draft${counts.draft === 1 ? "" : "s"} for term distribution`,
      line: "Every section must be complete before the Registrar distributes the term to Deans for review. Continue in Scheduling Calendar.",
      actionLabel: "Open Scheduling Calendar",
      to: "/schedules/term-calendar",
    };
  }
  if (counts.registrar_revision > 0) {
    return {
      tone: "action",
      eyebrow: "Registrar action needed",
      title: `Resolve ${counts.registrar_revision} instructor revision${counts.registrar_revision === 1 ? "" : "s"}`,
      line: "Instructor suggestions are waiting for a Registrar decision. Resolve each one before resubmitting for final Dean approval.",
      actionLabel: "Open Schedule Responses",
      to: "/schedule-responses",
    };
  }
  if (counts.pending_dean_review + counts.instructor_review + counts.pending_final_approval > 0) {
    const waiting = counts.pending_dean_review + counts.instructor_review + counts.pending_final_approval;
    return {
      tone: "wait",
      eyebrow: "Review workflow in progress",
      title: `${waiting} section${waiting === 1 ? "" : "s"} awaiting review`,
      line: "Everything built is submitted. The dean is reviewing — track progress in the scheduling hub.",
      actionLabel: "View Section Schedules",
      to: "/schedules/regular-class",
    };
  }
  return {
    tone: "done",
    eyebrow: "Ready for publication",
    title: "Every section has final Dean approval",
    line: "Finalize the term in Scheduling Calendar to publish all approved timetables together.",
    actionLabel: "Open Scheduling Calendar",
    to: "/schedules/term-calendar",
  };
}
