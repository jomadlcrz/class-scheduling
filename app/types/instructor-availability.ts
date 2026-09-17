/**
 * What an instructor DECLARES they are available for, in one term.
 *
 * A message to their Dean, not a constraint. Nothing the scheduler reads: the
 * Dean of their department records the authoritative configuration separately,
 * and that is what generation honours.
 */

/** One span of one weekday. Times are "HH:MM", 24-hour, as the API sends them. */
export type AvailabilityWindow = {
  /** Full weekday name — "Monday" … "Saturday", matching the backend. */
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

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
  windows: AvailabilityWindow[];
};

/** The body of a save. Sending an empty `windows` withdraws the declaration. */
export type AvailabilityDeclarationInput = {
  note: string | null;
  windows: AvailabilityWindow[];
};
