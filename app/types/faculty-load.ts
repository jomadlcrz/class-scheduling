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
  maxDailyHours: number;
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

export type LoadedSubject = {
  yearLevel: YearLevel;
  semesterCategory: Semester;
  subjectId: number;
  subjectCode: string;
  descriptiveTitle: string;
  units: number;
};

export type DailyLoad = {
  dayOfWeek: number;
  currentDailyHours: number;
};

/** One faculty's teaching term, as returned by GET /deans/view-faculty-loads (not filtered by term server-side). */
export type FacultyLoadRecord = {
  teachingTermId: number;
  programs: string[];
  departmentAbbrev: string;
  fullName: string;
  schoolYear: string;
  semester: string;
  loadedSubjects: LoadedSubject[];
  totalLoadUnits: number;
  maxDailyHours: number;
  maxWeeklyHours: number;
  currentWeeklyHours: number;
  dailyLoads: DailyLoad[];
};
