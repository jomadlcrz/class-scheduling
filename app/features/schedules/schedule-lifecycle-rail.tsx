import type { ReactNode } from "react";
import { AlertTriangleIcon, CheckIcon, ClockIcon, EditIcon } from "~/components/ui/icons";
import {
  scheduleReleaseStatusLabel,
  scheduleReleaseStatusTone,
  StatusBadge,
} from "~/features/academic-terms/status-badges";
import { formatRelativeTime } from "~/lib/time";
import type { ScheduleRelease, ScheduleReleaseStatus } from "~/types/schedule-release";

type Audience = "registrar" | "dean";

type ScheduleLifecycleRailProps = {
  release: ScheduleRelease;
  /** Whose vantage point the guidance is written from. */
  audience: Audience;
  /** Contextual next-step control(s), rendered beside the guidance (e.g. Submit / Withdraw). */
  action?: ReactNode;
};

type NodeState = "done" | "current" | "rejected" | "upcoming";
type StopView = { label: string; state: NodeState; sub: string };
type PanelTone = "gold" | "sky" | "emerald" | "red" | "slate";

/**
 * The schedule's honest three-stop pipeline: Draft → Dean Review → Approved.
 * A rejection isn't a fourth stop — it sends the release back to Draft carrying a
 * note, so it renders as the Draft stop flagged "changes requested".
 */
function stopsFor(status: ScheduleReleaseStatus): StopView[] {
  switch (status) {
    case "approved":
      return [
        { label: "Draft", state: "done", sub: "Submitted" },
        { label: "Dean Review", state: "done", sub: "Reviewed" },
        { label: "Approved", state: "done", sub: "Published" },
      ];
    case "pending_approval":
      return [
        { label: "Draft", state: "done", sub: "Submitted" },
        { label: "Dean Review", state: "current", sub: "In review" },
        { label: "Approved", state: "upcoming", sub: "Publishes on approval" },
      ];
    case "rejected":
      return [
        { label: "Draft", state: "rejected", sub: "Changes requested" },
        { label: "Dean Review", state: "upcoming", sub: "Resubmit to continue" },
        { label: "Approved", state: "upcoming", sub: "—" },
      ];
    case "draft":
    default:
      return [
        { label: "Draft", state: "current", sub: "Building" },
        { label: "Dean Review", state: "upcoming", sub: "—" },
        { label: "Approved", state: "upcoming", sub: "—" },
      ];
  }
}

const panelAccent: Record<PanelTone, { box: string; eyebrow: string }> = {
  gold: {
    box: "border-amber-200 bg-amber-50/70 dark:border-gold-400/20 dark:bg-gold-400/5",
    eyebrow: "text-amber-700 dark:text-gold-300",
  },
  sky: {
    box: "border-sky-200 bg-sky-50/70 dark:border-sky-400/20 dark:bg-sky-400/5",
    eyebrow: "text-sky-700 dark:text-sky-300",
  },
  emerald: {
    box: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/20 dark:bg-emerald-400/5",
    eyebrow: "text-emerald-700 dark:text-emerald-300",
  },
  red: {
    box: "border-red-200 bg-red-50/70 dark:border-red-400/20 dark:bg-red-400/5",
    eyebrow: "text-red-700 dark:text-red-300",
  },
  slate: {
    box: "border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/5",
    eyebrow: "text-slate-600 dark:text-slate-300",
  },
};

type Guidance = { tone: PanelTone; eyebrow: string; description: string };

/** Audience-aware "what's the state, and what happens next" copy. Status vocabulary stays backend-owned. */
function guidanceFor(release: ScheduleRelease, audience: Audience): Guidance {
  const submittedAgo = formatRelativeTime(release.submittedAt);
  const reviewedAgo = formatRelativeTime(release.reviewedAt);
  const approvedAgo = formatRelativeTime(release.approvedAt);
  const submitter = release.submittedBy?.name?.trim();

  if (audience === "dean") {
    switch (release.releaseStatus) {
      case "pending_approval":
        return {
          tone: "sky",
          eyebrow: "Needs your review",
          description: `Submitted${submittedAgo ? ` ${submittedAgo}` : ""}${
            submitter ? ` by ${submitter}` : ""
          }. Review the weekly schedule, then approve to publish it or reject with a note.`,
        };
      case "approved":
        return {
          tone: "emerald",
          eyebrow: "Approved",
          description: `You approved this${
            approvedAgo || reviewedAgo ? ` ${approvedAgo || reviewedAgo}` : ""
          }. It's published to the section's students and instructors.`,
        };
      case "rejected":
        return {
          tone: "red",
          eyebrow: "Returned to registrar",
          description: `You sent this back${
            reviewedAgo ? ` ${reviewedAgo}` : ""
          } for changes. It's back in the registrar's drafts.`,
        };
      default:
        return {
          tone: "slate",
          eyebrow: "Not yet submitted",
          description: "The registrar hasn't submitted this timetable for approval.",
        };
    }
  }

  switch (release.releaseStatus) {
    case "pending_approval":
      return {
        tone: "sky",
        eyebrow: "Awaiting the dean",
        description: `Submitted${
          submittedAgo ? ` ${submittedAgo}` : ""
        } and waiting in the dean's review queue. You can withdraw it while it's still pending.`,
      };
    case "approved":
      return {
        tone: "emerald",
        eyebrow: "Published",
        description: `Approved${
          approvedAgo ? ` ${approvedAgo}` : ""
        } — now visible to the students and instructors in this section.`,
      };
    case "rejected":
      return {
        tone: "red",
        eyebrow: "Changes requested",
        description:
          "The dean returned this to draft with a note. Revise the sessions, then resubmit for approval.",
      };
    case "draft":
    default:
      return {
        tone: "gold",
        eyebrow: "Ready to submit",
        description: `${release.sessionCount} session${
          release.sessionCount === 1 ? "" : "s"
        } saved. When it's complete, submit it to the department dean for approval.`,
      };
  }
}

function connectorTone(state: NodeState): string {
  if (state === "done") return "bg-emerald-400 dark:bg-emerald-500/70";
  if (state === "current") {
    return "bg-linear-to-r from-amber-400 to-slate-200 dark:from-gold-400/70 dark:to-white/10";
  }
  if (state === "rejected") {
    return "bg-linear-to-r from-red-400 to-slate-200 dark:from-red-400/60 dark:to-white/10";
  }
  return "bg-slate-200 dark:bg-white/10";
}

function StopNode({ stop, index }: { stop: StopView; index: number }) {
  if (stop.state === "done") {
    return (
      <span
        className="relative z-10 grid size-9 place-items-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-white dark:ring-surface-raised"
        aria-hidden="true"
      >
        <CheckIcon size={16} strokeWidth={3} />
      </span>
    );
  }

  if (stop.state === "rejected") {
    return (
      <span
        className="relative z-10 grid size-10 place-items-center rounded-full bg-red-500 text-white shadow-md ring-4 ring-red-100 dark:bg-red-500 dark:ring-red-400/20"
        aria-hidden="true"
      >
        <AlertTriangleIcon />
      </span>
    );
  }

  if (stop.state === "current") {
    return (
      <span
        className="relative z-10 grid size-10 place-items-center rounded-full bg-amber-500 text-white shadow-md ring-4 ring-amber-100 dark:bg-gold-500 dark:ring-gold-400/20"
        aria-hidden="true"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/30 dark:bg-gold-400/25" />
        <span className="relative">{index === 1 ? <ClockIcon size={16} /> : <EditIcon />}</span>
      </span>
    );
  }

  return (
    <span
      className="relative z-10 grid size-9 place-items-center rounded-full border-2 border-slate-200 bg-white font-body text-xs font-semibold text-slate-400 dark:border-white/15 dark:bg-surface-raised dark:text-slate-500"
      aria-hidden="true"
    >
      {index + 1}
    </span>
  );
}

function subTone(state: NodeState): string {
  if (state === "current") return "text-amber-700 dark:text-gold-300";
  if (state === "rejected") return "text-red-600 dark:text-red-300";
  if (state === "done") return "text-emerald-700 dark:text-emerald-300";
  return "text-slate-400 dark:text-slate-500";
}

/**
 * Shared status header for a schedule release — a branded three-stop rail plus an
 * audience-aware next-step panel. Used by the registrar builder, the dean's inbox
 * detail, and the preview surfaces so the lifecycle reads the same everywhere.
 */
export function ScheduleLifecycleRail({ release, audience, action }: ScheduleLifecycleRailProps) {
  const stops = stopsFor(release.releaseStatus);
  const guidance = guidanceFor(release, audience);
  const accent = panelAccent[guidance.tone];

  return (
    <section
      aria-label="Schedule approval status"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-surface-raised/60"
    >
      {/* Desktop: horizontal three-stop rail */}
      <ol className="hidden grid-cols-3 sm:grid" aria-label="Approval progress">
        {stops.map((stop, index) => {
          const isLast = index === stops.length - 1;
          return (
            <li key={stop.label} className="relative flex min-w-0 flex-col items-center px-2 text-center">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[calc(50%+1.25rem)] top-4.5 h-0.5 w-[calc(100%-2.5rem)] ${connectorTone(stop.state)}`}
                />
              )}
              <StopNode stop={stop} index={index} />
              <div className="mt-3 w-full min-w-0">
                <p className="truncate font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                  {stop.label}
                </p>
                <p className={`mt-0.5 truncate font-body text-xs ${subTone(stop.state)}`}>{stop.sub}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact node bar — the panel below carries the words. */}
      <div className="flex items-center gap-2 sm:hidden" aria-hidden="true">
        {stops.map((stop, index) => {
          const isLast = index === stops.length - 1;
          return (
            <div key={stop.label} className={`flex items-center gap-2 ${isLast ? "" : "flex-1"}`}>
              <StopNode stop={stop} index={index} />
              {!isLast && <span className={`h-0.5 flex-1 ${connectorTone(stop.state)}`} />}
            </div>
          );
        })}
      </div>

      {/* Next-step panel */}
      <div className={`mt-5 rounded-lg border px-4 py-3.5 ${accent.box}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`font-body text-xs font-semibold uppercase tracking-wider ${accent.eyebrow}`}>
                {guidance.eyebrow}
              </p>
              <StatusBadge tone={scheduleReleaseStatusTone(release.releaseStatus)}>
                {scheduleReleaseStatusLabel(release.releaseStatus)}
              </StatusBadge>
            </div>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-navy-700 dark:text-mist-100">
              {guidance.description}
            </p>
          </div>
          {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
        </div>

        {release.releaseStatus === "rejected" && release.rejectionReason && (
          <div className="mt-3 rounded-md border border-red-200 bg-white/70 px-3 py-2 dark:border-red-400/20 dark:bg-red-950/20">
            <p className="font-body text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
              Dean's note
            </p>
            <p className="mt-1 font-body text-sm leading-relaxed text-navy-700 dark:text-mist-100">
              {release.rejectionReason}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
