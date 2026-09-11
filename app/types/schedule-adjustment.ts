import type { SubjectType } from "~/features/classroom-mapping/mapping-model";

/**
 * The Schedule Adjustment Board's read model.
 *
 * One term's whole timetable plus what generation could not fit, from
 * `GET /schedule-adjustment-board`. Everything here is backend truth — the
 * board never recomputes completeness or room eligibility on its own, because
 * the save paths it calls (`PATCH /regular-schedules/<id>/placement` and
 * `POST /regular-schedules`) validate against the backend's own arithmetic and
 * a second opinion here could only ever disagree with them.
 */

/** One persisted meeting, on the room/day/time axis the map draws. */
export type AdjustmentMeeting = {
  id: number;
  syId: number;
  semesterNumber: number;
  programId: number;
  programAbbrev: string | null;
  departmentId: number | null;
  departmentAbbrev: string | null;
  setId: number;
  setName: string | null;
  yearLevel: number | null;
  subjectId: number;
  subjectCode: string | null;
  subjectTitle: string | null;
  subjectType: string | null;
  classMode: string;
  sessionMode: "LEC" | "LAB";
  instructorId: number | null;
  instructorName: string;
  /** Null for a Synchronous or Asynchronous meeting, which holds no room. */
  roomId: number | null;
  roomName: string | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  /** A Registrar-finalized Dean major: fixed occupancy, drawn but never moved. */
  locked: boolean;
  /** Why this meeting cannot be moved, in the backend's words. */
  lockReason: string | null;
  editable: boolean;
  origin: string;
  isDeanMajor: boolean;
};

/** A curriculum subject this section still owes meetings for. */
export type AdjustmentUnplacedSubject = {
  subjectId: number;
  subjectCode: string;
  subjectTitle: string;
  subjectType: string;
  /** Meetings the curriculum requires, from the subject type's allocation. */
  needed: number;
  /** Meetings already on the board for it. */
  placed: number;
  remaining: number;
  /** Which halves are already placed — a Major with Lab holding only "LEC"
   *  still owes its laboratory. */
  placedSessionModes: string[];
};

export type AdjustmentSetStatus = "unscheduled" | "incomplete" | "ready";

export type AdjustmentSet = {
  setId: number;
  setName: string | null;
  setCode: string;
  yearLevel: number;
  programId: number;
  programAbbrev: string | null;
  departmentId: number | null;
  departmentAbbrev: string | null;
  status: AdjustmentSetStatus;
  sessionCount: number;
  placedMeetings: number;
  releaseId: number | null;
  releaseStatus: string | null;
  /** False once the release has moved past the Registrar — the board says so
   *  rather than letting the save discover it. */
  editable: boolean;
  unplaced: AdjustmentUnplacedSubject[];
};

export type AdjustmentRoom = {
  id: number;
  name: string;
  type: string | null;
  capacity: number | null;
  buildingId: number;
  buildingName: string | null;
  floorLevel: number | null;
  /** Empty means every program may use it — the room_programs access rule. */
  programIds: number[];
};

export type AdjustmentBoard = {
  term: { syId: number; semesterNumber: number };
  meetings: AdjustmentMeeting[];
  sets: AdjustmentSet[];
  rooms: AdjustmentRoom[];
  labTimeSlots: { startTime: string; endTime: string }[];
};

/** Narrow a backend subject-type string to the legend's union. */
export function toSubjectType(raw: string | null | undefined): SubjectType {
  const value = (raw ?? "").trim();
  return (value || "Major without Lab") as SubjectType;
}
