/**
 * What an instructor DECLARES they are available for, in one term.
 *
 * A message to their Dean, not a constraint. Nothing the scheduler reads: the
 * Dean of their department records the authoritative configuration separately,
 * and that is what generation honours.
 */

/** Teaching days in week order — matches the backend's WEEK_DAYS. */
export const AVAILABILITY_WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** One span of one weekday. Times are "HH:MM", 24-hour, as the API sends them. */
export type AvailabilityWindow = {
  /** Full weekday name — "Monday" … "Saturday", matching the backend. */
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

export type AvailabilitySubmissionState =
  | "not_submitted"
  | "submitted"
  | "reopened"
  | "configured"
  | "term_closed";

export type AvailabilityDeclaration = {
  syId: number;
  schoolYear: string;
  semesterNumber: number;
  /**
   * False means nothing has been said yet — which leaves the instructor
   * UNCONSTRAINED, not unavailable.
   */
  declared: boolean;
  /** Free text notes from the instructor. */
  note: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
  submissionState?: AvailabilitySubmissionState;
  submissionStateLabel?: string;
  canSubmit?: boolean;
  reopenedAt?: string | null;
  reopenNote?: string | null;
  windows: AvailabilityWindow[];
};

/** The body of a save. Sending an empty `windows` withdraws the declaration. */
export type AvailabilityDeclarationInput = {
  note: string | null;
  windows: AvailabilityWindow[];
};

/**
 * What the Dean SET the instructor's availability to — the decision, and the
 * only availability the schedule is built around. Read-only on this side.
 *
 * `configured: false` is a normal state meaning NO restriction (schedulable
 * anywhere in the normal teaching day), which is why `hours` is null then,
 * never 0.
 */
export type AvailabilityConfiguration = {
  configured: boolean;
  windows: AvailabilityWindow[];
  /** Weekly total of `windows`; null when nothing is configured. */
  hours: number | null;
  /** The Dean's reply to the instructor. */
  note: string | null;
  /** The Dean who decided. */
  configuredBy: string | null;
  updatedAt: string | null;
  /** true accepted as sent, false changed, null nothing was sent to compare. */
  matchesDeclaration: boolean | null;
  /** Backend key: not_configured | accepted_as_sent | changed | set_by_dean. */
  decision: string;
  /** Backend words for `decision` — render verbatim. */
  decisionLabel: string;
};
