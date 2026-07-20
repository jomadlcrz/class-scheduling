import type { Semester, YearLevel } from "~/types/subject";

/** One subject to assign within a program (matched by code + title on the backend). */
export type SubjectLoadInput = {
  subjectCode: string;
  descriptiveTitle: string;
};

/** Subjects to assign for a single program (matched by abbrev on the backend). */
export type ProgramLoadInput = {
  programAbbrev: string;
  subjects: SubjectLoadInput[];
};

/** One faculty member's full term load (matched by first+last name on the backend). */
export type FacultyLoadInput = {
  firstName: string;
  lastName: string;
  maxWeeklyHours: number;
  programs: ProgramLoadInput[];
};

/** A department faculty roster entry — no id from the backend, so firstName+lastName is the key. */
export type DepartmentFacultyOption = {
  department: string;
  firstName: string;
  midName: string | null;
  lastName: string;
  gender: string;
  civilStatus: string;
  email: string | null;
  mobile: string | null;
  roles: string[];
};

export type DepartmentSubjectEntry = {
  subjectId: number;
  subjectCode: string;
  descriptiveTitle: string;
  units: number;
  prerequisites: string[];
};

export type DepartmentSubjectSemesterGroup = {
  semester: Semester;
  semesterTotalUnits: number;
  subjects: DepartmentSubjectEntry[];
};

export type DepartmentSubjectYearGroup = {
  yearLevel: YearLevel;
  yearTotalUnits: number;
  semesterDetails: DepartmentSubjectSemesterGroup[];
};

/** One program's curriculum tree for the dean's department, with the program abbrev joined in from programService. */
export type DepartmentSubjectProgram = {
  programAbbrev: string;
  programName: string;
  programTotalUnits: number;
  curriculumDetails: DepartmentSubjectYearGroup[];
};

/** One scheduled session under a subject, as returned by GET /deans/faculty-loading. */
export type FacultyLoadingSchedule = {
  day: string;
  time: string;
  numberOfStudents: number;
  course: string;
  yearLevel: YearLevel;
  setCode: string;
  room: string | null;
};

/** One subject an instructor is carrying this term, with its scheduled sessions. */
export type FacultyLoadingSubject = {
  subjectCode: string;
  descriptiveTitle: string;
  units: { total: number; lecHours: number; labHours: number };
  schedules: FacultyLoadingSchedule[];
};

/** One instructor's loading sheet for a term, as returned by GET /deans/faculty-loading. */
export type FacultyLoadingEntry = {
  instructorName: string;
  department: string;
  semester: string;
  academicYear: string;
  subjects: FacultyLoadingSubject[];
};
