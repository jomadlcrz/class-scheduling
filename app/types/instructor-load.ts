/**
 * The instructor's own teaching load for one term, as `GET /instructor/analytics` reports it.
 */

/** One meeting of an assigned subject. */
export type InstructorSubjectSession = {
  regularSchedId: number | null;
  /** Full day name from the backend's DayOfWeek enum, e.g. "Monday". */
  day: string | null;
  /** Already 12-hour formatted by the backend. */
  startTime: string | null;
  endTime: string | null;
  hours: number;
  classMode: string | null;
  room: string | null;
  /** Seats in that room. Null when the room is unmeasured — NOT zero seats. */
  roomCapacity: number | null;
  /** Regular students enrolled in the set, plus irregulars in this meeting. */
  numberOfStudents: number;
  program: string | null;
  yearLevel: number | null;
  setCode: string | null;
};

/** One subject the instructor is assigned to teach this term. */
export type InstructorAssignedSubject = {
  subjectId: number | null;
  subjectCode: string | null;
  descriptiveTitle: string | null;
  /** Backend SubjectTypeName value, e.g. "Major with Lab". */
  subjectType: string | null;
  units: number;
  lecHours: number;
  labHours: number;
  programAbbrev: string | null;
  programName: string | null;
  yearLevel: number | null;
  expectedWeeklyHours: number;
  studentCount: number;
  /** False while the timetable is withheld, even when meetings exist. */
  isScheduled: boolean;
  sessions: InstructorSubjectSession[];
};

export type InstructorLoadSummary = {
  maxWeeklyHours: number;
  bookedHours: number;
  remainingHours: number;
  loadPercent: number;
  expectedWeeklyHours: number;
  assignedSubjects: number;
  scheduledSubjects: number;
  sessions: number;
  units: number;
};

export type InstructorTeachingLoad = {
  instructorName: string | null;
  schoolYear: string | null;
  semesterNumber: number | null;
  timetableVisible: boolean;
  summary: InstructorLoadSummary;
  subjects: InstructorAssignedSubject[];
};
