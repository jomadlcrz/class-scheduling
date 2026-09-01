import { apiGet } from "~/lib/api";

/**
 * Backend enum values (app/enums.py), fetched per-vocabulary from
 * public /enums/<name> endpoints (02-bootstrap-enums-terms.md).
 */

export type DayOfWeekOption = {
  id: number;
  name: string;
};

export type YearLevelOption = {
  id: number;
  name: string;
};

export type DegreeTypeProgramLengthRecommendation = {
  degree_type: string;
  recommended_program_length: number;
};

export type DegreeTypeProgramLengthsResponse = {
  minimum_program_length: number;
  maximum_program_length: number;
  recommendations: DegreeTypeProgramLengthRecommendation[];
};

export type EnumOptions = {
  academicStatus: string[];
  civilStatus: string[];
  classMode: string[];
  classroomStatus: string[];
  dayOfWeek: DayOfWeekOption[];
  degreeType: string[];
  departmentType: string[];
  enrollmentState: string[];
  gender: string[];
  nameSuffix: string[];
  personnelType: string[];
  roleName: string[];
  roomType: string[];
  sessionMode: string[];
  studentType: string[];
  subjectType: string[];
  termStatus: string[];
  yearLevel: string[];
  yearLevels: YearLevelOption[];
};

// Static per deploy, so one fetch serves the whole session.
let cached: Promise<EnumOptions> | null = null;

async function fetchOptions(): Promise<EnumOptions> {
  const [
    academicStatus,
    civilStatus,
    classMode,
    classroomStatus,
    dayOfWeek,
    degreeType,
    departmentType,
    enrollmentState,
    gender,
    nameSuffix,
    personnelType,
    roleName,
    roomType,
    sessionMode,
    studentType,
    subjectType,
    termStatus,
    yearLevel,
  ] = await Promise.all([
    apiGet<string[]>("/enums/academic-statuses").catch(() => []),
    apiGet<string[]>("/enums/civil-statuses").catch(() => []),
    apiGet<string[]>("/enums/class-modes").catch(() => []),
    apiGet<string[]>("/enums/classroom-statuses").catch(() => []),
    apiGet<DayOfWeekOption[]>("/enums/days-of-week").catch(() => []),
    apiGet<string[]>("/enums/degree-types").catch(() => []),
    apiGet<string[]>("/enums/department-types").catch(() => []),
    apiGet<string[]>("/enums/enrollment-states").catch(() => []),
    apiGet<string[]>("/enums/genders").catch(() => []),
    apiGet<string[]>("/enums/name-suffixes").catch(() => []),
    apiGet<string[]>("/enums/personnel-types").catch(() => []),
    apiGet<string[]>("/enums/roles").catch(() => []),
    apiGet<string[]>("/enums/room-types").catch(() => []),
    apiGet<string[]>("/enums/session-modes").catch(() => []),
    apiGet<string[]>("/enums/student-types").catch(() => []),
    apiGet<string[]>("/enums/subject-types").catch(() => []),
    apiGet<string[]>("/enums/term-statuses").catch(() => []),
    apiGet<string[]>("/enums/year-levels").catch(() => []),
  ]);

  return {
    academicStatus,
    civilStatus,
    classMode,
    classroomStatus,
    dayOfWeek,
    degreeType,
    departmentType,
    enrollmentState,
    gender,
    nameSuffix,
    personnelType,
    roleName,
    roomType,
    sessionMode,
    studentType,
    subjectType,
    termStatus,
    yearLevel,
    yearLevels: yearLevel.map((name, i) => ({ id: i + 1, name })),
  };
}

function getOptions(): Promise<EnumOptions> {
  cached ??= fetchOptions().catch((err) => {
    cached = null; // allow retry on next call
    throw err;
  });
  return cached;
}

export const enumService = {
  getOptions,
  getEnrollmentStates: () => apiGet<string[]>("/enums/enrollment-states"),
  getTermStatuses: () => apiGet<string[]>("/enums/term-statuses"),
  getYearLevels: () => apiGet<string[]>("/enums/year-levels"),
  getClassModes: () => apiGet<string[]>("/enums/class-modes"),
  getSessionModes: () => apiGet<string[]>("/enums/session-modes"),
  getGenders: () => apiGet<string[]>("/enums/genders"),
  getCivilStatuses: () => apiGet<string[]>("/enums/civil-statuses"),
  getClassroomStatuses: () => apiGet<string[]>("/enums/classroom-statuses"),
  getRoles: () => apiGet<string[]>("/enums/roles"),
  getStudentTypes: () => apiGet<string[]>("/enums/student-types"),
  getNameSuffixes: () => apiGet<string[]>("/enums/name-suffixes"),
  getAcademicStatuses: () => apiGet<string[]>("/enums/academic-statuses"),
  getPersonnelTypes: () => apiGet<string[]>("/enums/personnel-types"),
  getRoomTypes: () => apiGet<string[]>("/enums/room-types"),
  getSubjectTypes: () => apiGet<string[]>("/enums/subject-types"),
  getDaysOfWeek: () => apiGet<DayOfWeekOption[]>("/enums/days-of-week"),
  getDepartmentTypes: () => apiGet<string[]>("/enums/department-types"),
  getDegreeTypes: () => apiGet<string[]>("/enums/degree-types"),
  getDegreeTypeProgramLengths: () => apiGet<DegreeTypeProgramLengthsResponse>("/enums/degree-type-program-lengths"),
};
