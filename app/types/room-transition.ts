/** Travel between consecutive classes — GET /scheduling/room-transitions.
 *
 *  Neither solver models distance: a section's and an instructor's clash rules
 *  are non-overlap in TIME alone, so a class can legally begin the second
 *  another ends four floors away. These findings are how that becomes visible
 *  before a Dean approves. Nothing here blocks anything.
 */

export type TransitionSeverity = "critical" | "warning" | "notice";

/** One end of a walk — where somebody is, and when they are there. */
export interface TransitionSide {
  scheduleId: number;
  subjectCode: string;
  /** Present on instructor findings, where the section is not the subject of the sentence. */
  setCode: string | null;
  roomId: number | null;
  roomName: string;
  buildingId: number | null;
  buildingName: string;
  floorLevel: number | null;
  roomType: string;
  roomTypeLabel: string;
  /** "SHS Building, 4th floor" — where the room is, in words. */
  place: string;
  startsAt: string;
  endsAt: string;
}

export interface RoomTransitionFinding {
  severity: TransitionSeverity;
  who: { kind: "section" | "instructor"; id: number; name: string };
  day: string;
  gapMinutes: number;
  floorsChanged: number;
  buildingChanged: boolean;
  from: TransitionSide;
  to: TransitionSide;
  /** Short enough for a list row. */
  headline: string;
  /** The full sentence: who, when, which rooms, how long they have. */
  detail: string;
}

export interface RoomTransitionReport {
  meta: {
    syId: number;
    semesterNumber: number;
    programId: number | null;
    programAbbrev: string | null;
    setId: number | null;
    setCode: string | null;
    meetingsExamined: number;
    meetingsSkippedNoRoom: number;
  };
  thresholds: {
    gapConsideredMinutes: number;
    tightGapMinutes: number;
    steepFloorChange: number;
  };
  summary: {
    total: number;
    critical: number;
    warning: number;
    notice: number;
    sectionsAffected: number;
    instructorsAffected: number;
    /** One sentence for the top of the panel. */
    headline: string;
  };
  definitions: Record<string, string>;
  findings: RoomTransitionFinding[];
}
