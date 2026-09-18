import type { ReactNode } from "react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card } from "~/components/ui/card";
import { AlertTriangleIcon, CheckIcon, ClockIcon, EditIcon } from "~/components/ui/icons";
import { Stepper, type StepDefinition } from "~/components/ui/stepper";
import {
  scheduleReleaseStatusLabel,
  scheduleReleaseStatusTone,
  StatusBadge,
} from "~/features/academic-terms/status-badges";
import { formatRelativeTime } from "~/lib/time";
import type { ScheduleRelease } from "~/types/schedule-release";

type Audience = "registrar" | "dean";

type ScheduleLifecycleRailProps = {
  release: ScheduleRelease;
  audience: Audience;
  action?: ReactNode;
};

/**
 * The 6 stages of the academic schedule release lifecycle:
 * 1. Draft (saved sessions building up before submission)
 * 2. Initial Dean Review (dean reviews before forwarding to instructors)
 * 3. Instructor Review (instructors review proposed schedules)
 * 4. Registrar Resolution (registrar reviews suggestions if revision needed)
 * 5. Final Dean Approval (dean gives final sign-off)
 * 6. Term Publication (registrar publishes whole term)
 */
export const SCHEDULE_LIFECYCLE_STEPS: StepDefinition[] = [
  { key: "draft", label: "Draft" },
  { key: "dean_review", label: "Initial Dean Review" },
  { key: "instructor_review", label: "Instructor Review" },
  { key: "registrar_resolution", label: "Registrar Resolution" },
  { key: "final_approval", label: "Final Dean Approval" },
  { key: "term_publication", label: "Term Publication" },
];

/**
 * Per-audience step links — only steps with a role-accessible page distinct from the
 * one the rail is currently rendered on get a link; the rest stay static labels.
 */
function lifecycleStepsFor(audience: Audience): StepDefinition[] {
  return SCHEDULE_LIFECYCLE_STEPS.map((step) => {
    if (step.key === "instructor_review") {
      return { ...step, href: "/schedule-responses" };
    }
    if (audience === "registrar") {
      if (step.key === "registrar_resolution") return { ...step, href: "/schedules/adjustment-board" };
      if (step.key === "term_publication") return { ...step, href: "/schedules/term-calendar" };
    }
    return step;
  });
}

/** Maps backend release status to the zero-based step index in the 6-stage lifecycle pipeline. */
export function scheduleLifecycleStepIndex(release: ScheduleRelease): number {
  if (release.releaseStatus === "approved" && release.termFinalized) {
    return 6; // All completed
  }
  switch (release.releaseStatus) {
    case "draft":
      return 0;
    case "pending_dean_review":
    case "rejected":
      return 1;
    case "instructor_review":
      return 2;
    case "registrar_revision":
      return 3;
    case "pending_final_approval":
      return 4;
    case "approved":
      return 5;
    default:
      return 0;
  }
}

type AlertVariant = "info" | "warning" | "success" | "destructive" | "default";
type Guidance = { variant: AlertVariant; icon: ReactNode; eyebrow: string; description: string };

function guidanceFor(release: ScheduleRelease, audience: Audience): Guidance {
  const submittedAgo = formatRelativeTime(release.submittedAt);
  const reviewedAgo = formatRelativeTime(release.reviewedAt);
  const approvedAgo = formatRelativeTime(release.approvedAt);
  const submitter = release.submittedBy?.name?.trim();

  if (audience === "dean") {
    switch (release.releaseStatus) {
      case "pending_dean_review":
        return {
          variant: "info",
          icon: <ClockIcon />,
          eyebrow: "Initial Dean Review",
          description:
            "Review the generated schedule before releasing it to instructors for their response." +
            (submittedAgo
              ? ` Submitted ${submittedAgo}${submitter ? ` by ${submitter}` : ""}.`
              : ""),
        };
      case "instructor_review":
        return {
          variant: "info",
          icon: <ClockIcon />,
          eyebrow: "Instructor Review",
          description: "With instructors — the proposed schedule is in instructor review and is not official.",
        };
      case "registrar_revision":
        return {
          variant: "warning",
          icon: <EditIcon />,
          eyebrow: "With Registrar for Resolution",
          description: "The schedule is with the Registrar for resolution — nothing for you to do until it comes back.",
        };
      case "pending_final_approval":
        return {
          variant: "info",
          icon: <ClockIcon />,
          eyebrow: "Final Dean Approval",
          description: "The Registrar has completed resolution. Review the final schedule before giving final approval.",
        };
      case "approved":
        return {
          variant: "success",
          icon: <CheckIcon />,
          eyebrow: release.termFinalized ? "Published" : "Final Approval Complete",
          description: release.termFinalized
            ? "Published to students and instructors."
            : `You gave final approval${approvedAgo ? ` ${approvedAgo}` : ""}. Waiting for the Registrar to finalize and publish the term.`,
        };
      case "rejected":
        return {
          variant: "destructive",
          icon: <AlertTriangleIcon />,
          eyebrow: "Returned to Registrar",
          description: `Sent back${reviewedAgo ? ` ${reviewedAgo}` : ""} for changes. Returned during Initial Dean Review.`,
        };
      default:
        return {
          variant: "default",
          icon: <EditIcon />,
          eyebrow: "Not Yet Submitted",
          description: "The registrar hasn't submitted this timetable for approval.",
        };
    }
  }

  // Registrar audience
  switch (release.releaseStatus) {
    case "pending_dean_review":
      return {
        variant: "info",
        icon: <ClockIcon />,
        eyebrow: "Initial Dean Review",
        description: `Awaiting the dean.${submittedAgo ? ` Submitted ${submittedAgo}.` : ""} You can withdraw while it's pending.`,
      };
    case "instructor_review":
      return {
        variant: "info",
        icon: <ClockIcon />,
        eyebrow: "Instructor Review",
        description: "Assigned instructors are reviewing the proposed schedule.",
      };
    case "registrar_revision":
      return {
        variant: "warning",
        icon: <EditIcon />,
        eyebrow: "Registrar Resolution",
        description: "Revision required — review or revise the schedule before final resubmission.",
      };
    case "pending_final_approval":
      return {
        variant: "info",
        icon: <ClockIcon />,
        eyebrow: "Final Dean Approval",
        description: "Awaiting final approval. The resolved schedule has been resubmitted for the Dean's final decision.",
      };
    case "approved":
      return {
        variant: "success",
        icon: <CheckIcon />,
        eyebrow: release.termFinalized ? "Published" : "Ready for Publication",
        description: release.termFinalized
          ? "Published — visible to students and instructors."
          : `Approved${approvedAgo ? ` ${approvedAgo}` : ""}. Waiting for the Registrar's Finalize & Publish for the whole term in Scheduling Calendar.`,
      };
    case "rejected":
      return {
        variant: "destructive",
        icon: <AlertTriangleIcon />,
        eyebrow: "Changes Requested",
        description: "The dean returned this schedule. Revise the sessions, then resubmit for approval.",
      };
    case "draft":
    default:
      return {
        variant: "warning",
        icon: <EditIcon />,
        eyebrow: "Ready to Submit",
        description: `${release.sessionCount} session${
          release.sessionCount === 1 ? "" : "s"
        } saved. Submit when the timetable is complete.`,
      };
  }
}

/**
 * Reusable schedule release lifecycle status rail.
 * Uses the design system's Card, Stepper, and Alert components.
 */
export function ScheduleLifecycleRail({
  release,
  audience,
  action,
}: ScheduleLifecycleRailProps) {
  const currentIndex = scheduleLifecycleStepIndex(release);
  const guidance = guidanceFor(release, audience);
  const showNote = release.releaseStatus === "rejected" && Boolean(release.rejectionReason);

  return (
    <Card className="p-4 sm:p-5">
      {/* Reusable Stepper Component in Snake (Multi-row Zigzag) layout */}
      <Stepper
        variant="snake"
        columns={3}
        steps={lifecycleStepsFor(audience)}
        currentIndex={currentIndex}
        readOnly
      />

      {/* Reusable Alert Component showing phase guidance and next actions */}
      <Alert variant={guidance.variant} className="mt-5">
        {guidance.icon}
        <AlertTitle>
          <span className="inline-flex flex-wrap items-center gap-2">
            {guidance.eyebrow}
            <StatusBadge tone={scheduleReleaseStatusTone(release.releaseStatus)}>
              {scheduleReleaseStatusLabel(release.releaseStatus)}
            </StatusBadge>
          </span>
        </AlertTitle>
        <AlertDescription>
          {guidance.description}
          {showNote && (
            <p className="mt-2 font-semibold">
              Dean's note: <span className="font-normal">{release.rejectionReason}</span>
            </p>
          )}
        </AlertDescription>
        {action && <AlertAction>{action}</AlertAction>}
      </Alert>
    </Card>
  );
}

