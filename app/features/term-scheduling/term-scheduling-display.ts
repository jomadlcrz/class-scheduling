import type {
  TermSchedulingCalendar,
  TermSchedulingDetailStage,
  TermSchedulingPhaseValue,
} from "~/types/term-scheduling";
import type { BadgeTone } from "~/components/ui/badge";

/**
 * Display helpers for the term's scheduling calendar.
 *
 * Phase labels come from the backend (`phaseLabel`) per the backend-truth
 * convention; what lives here is only presentation — tone, ordering, and the
 * wording of a deadline countdown, none of which the API expresses.
 */

export const PHASE_TONES: Record<TermSchedulingPhaseValue, BadgeTone> = {
  major_scheduling: "violet",
  generation: "sky",
  suggestion_window: "gold",
  resolution: "gold",
  finalized: "emerald",
};

/** One line saying what the term is waiting for, in the college's own terms. */
export const PHASE_SUMMARY: Record<TermSchedulingPhaseValue, string> = {
  major_scheduling: "Deans are submitting major-subject schedules. All departments.",
  generation: "Schedules are being generated. Nothing is released while this runs.",
  suggestion_window: "Instructors are accepting or suggesting. Nothing is applied yet.",
  resolution: "The shift request is closed and the suggestions are being resolved.",
  finalized: "The term's schedule is published. Changes go through an edit request.",
};

/**
 * The same phases once they have been and gone.
 */
export const PHASE_SUMMARY_CLOSED: Partial<Record<TermSchedulingPhaseValue, string>> = {
  major_scheduling: "Major scheduling is closed. The submitted majors are locked as constraints.",
  suggestion_window: "The shift request is closed. Anyone who did not answer accepted their schedule.",
};

export const SUGGESTION_STAGE_SUMMARY: Record<TermSchedulingDetailStage, string> = {
  not_started: "This term has not been configured yet.",
  major_scheduling:
    "Major scheduling has not closed yet, so there is nothing for instructors to answer.",
  generation:
    "Generated schedules are still with the Registrar. Send ready departments to their Deans from Master Schedules; nothing has reached instructors yet.",
  initial_review:
    "Departments are reaching their instructors. The shift request has not opened yet.",
  ready_for_suggestions:
    "Every department has reached its instructors. The Registrar can open the shift request.",
  suggestion_window: PHASE_SUMMARY.suggestion_window,
  resolution: PHASE_SUMMARY_CLOSED.suggestion_window!,
  final_approval: PHASE_SUMMARY_CLOSED.suggestion_window!,
  ready_for_publication: PHASE_SUMMARY_CLOSED.suggestion_window!,
  finalized: PHASE_SUMMARY_CLOSED.suggestion_window!,
};

export const DETAIL_STAGE_LABEL: Record<TermSchedulingDetailStage, string> = {
  not_started: "Not started",
  major_scheduling: "Major Scheduling",
  generation: "Generating Schedules",
  initial_review: "Initial Dean Review",
  ready_for_suggestions: "Ready for Shift Request",
  suggestion_window: "Instructor Review",
  resolution: "Registrar Resolution",
  final_approval: "Final Dean Approval",
  ready_for_publication: "Ready for Publication",
  finalized: "Published",
};

export const DETAIL_STAGE_TONE: Record<TermSchedulingDetailStage, BadgeTone> = {
  not_started: "slate",
  major_scheduling: "violet",
  generation: "sky",
  initial_review: "sky",
  ready_for_suggestions: "gold",
  suggestion_window: "gold",
  resolution: "gold",
  final_approval: "navy",
  ready_for_publication: "sky",
  finalized: "emerald",
};

export function suggestionWindowHasClosed(stage: TermSchedulingDetailStage): boolean {
  return (
    stage === "resolution" ||
    stage === "final_approval" ||
    stage === "ready_for_publication" ||
    stage === "finalized"
  );
}

export function formatDeadline(value: string | null): string {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function deadlineDistance(value: string | null, serverTime: string): string | null {
  if (!value) return null;
  const due = new Date(value).getTime();
  const now = new Date(serverTime).getTime();
  if (Number.isNaN(due) || Number.isNaN(now)) return null;

  const diffMinutes = Math.round((due - now) / 60000);
  const past = diffMinutes < 0;
  const minutes = Math.abs(diffMinutes);
  const value_ =
    minutes < 60
      ? `${minutes} minute${minutes === 1 ? "" : "s"}`
      : minutes < 60 * 24
        ? `${Math.round(minutes / 60)} hour${Math.round(minutes / 60) === 1 ? "" : "s"}`
        : `${Math.round(minutes / (60 * 24))} day${Math.round(minutes / (60 * 24)) === 1 ? "" : "s"}`;
  return past ? `${value_} ago` : `in ${value_}`;
}

export function activeDeadline(
  calendar: TermSchedulingCalendar,
): { label: string; value: string | null; passed: boolean } | null {
  if (calendar.phase === "major_scheduling") {
    return {
      label: "Major scheduling deadline",
      value: calendar.majorsDueAt,
      passed: calendar.majorsDeadlinePassed,
    };
  }
  if (calendar.phase === "suggestion_window") {
    return {
      label: "Suggestion deadline",
      value: calendar.suggestionsDueAt,
      passed: calendar.suggestionsDeadlinePassed,
    };
  }
  return null;
}

export function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 16);
}
