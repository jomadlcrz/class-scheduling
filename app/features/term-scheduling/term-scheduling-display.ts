import type {
  TermSchedulingPhaseValue,
} from "~/types/term-scheduling";

/**
 * Display helpers for the term's scheduling calendar.
 *
 * Phase labels come from the backend (`phaseLabel`) per the backend-truth
 * convention; what lives here is only presentation — tone, ordering, and the
 * wording of a deadline countdown, none of which the API expresses.
 */

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
