/** Pre-approval review — GET /scheduling/pre-approval-review.
 *
 *  Three blocks, because the Dean of CBA asked for three things and the honest
 *  answer to each was different: conflicts are PREVENTED (so the useful output
 *  is proof the check ran), room availability was never surfaced anywhere, and
 *  the concerns are recomputed from the saved schedule rather than remembered.
 */

export type ReviewSeverity = "critical" | "warning" | "notice";

/** One hard check, re-run against the saved rows. Expected to pass. */
export interface ClearanceCheck {
  title: string;
  passed: boolean;
  count: number;
  /** What the check is for, in a sentence. */
  why: string;
  /** Up to five offenders, already formatted. Empty when it passed. */
  examples: string[];
}

export interface RoomAccessRow {
  roomType: string;
  permitted: number;
  total: number;
  lockedOut: number;
}

export interface RoomUsageRow {
  roomId: number;
  roomName: string;
  roomType: string;
  roomCapacity: number | null;
  bookedHours: number;
  freeHours: number;
  utilisationPercent: number;
}

export interface OverCapacityRow {
  scheduleId: number;
  subjectCode: string;
  setCode: string | null;
  roomName: string;
  roomCapacity: number;
  studentCount: number;
  day: string;
  startsAt: string;
  shortBy: number;
}

export interface ReviewConcern {
  severity: ReviewSeverity;
  /** Stable identifier, e.g. "unassigned_instructor". */
  key: string;
  title: string;
  detail: string;
  /** Shape varies by `key`; rendered generically. */
  items: Record<string, unknown>[];
}

export interface PreApprovalReview {
  meta: {
    syId: number;
    semesterNumber: number;
    programId: number;
    programAbbrev: string | null;
    meetingsExamined: number;
    sectionCount: number;
  };
  summary: {
    checksRun: number;
    checksFailed: number;
    concerns: number;
    critical: number;
    warning: number;
    notice: number;
    headline: string;
  };
  clearance: ClearanceCheck[];
  rooms: {
    access: RoomAccessRow[];
    usage: RoomUsageRow[];
    fit: {
      overCapacity: OverCapacityRow[];
      /** Counted, not listed: every class is exactly full by design. */
      atCapacityCount: number;
      spareSeats: number;
      seatedTotal: number;
    };
    totals: {
      roomsUsed: number;
      roomsPermitted: number;
      bookedHours: number;
      weekHoursPerRoom: number;
    };
  };
  concerns: ReviewConcern[];
}
