import { ApiError, apiGet, apiMessage, apiPost } from "~/lib/api";
import { programService } from "~/services/program.service";
import type {
  DailyLoad,
  DepartmentFacultyOption,
  DepartmentSubjectProgram,
  FacultyLoadInput,
  FacultyLoadRecord,
  LoadedSubject,
} from "~/types/faculty-load";

/**
 * Faculty loading service (deans module). The backend matches faculty by
 * first/last name and resolves subjects per program abbreviation.
 */

/** POST /deans/create-faculty-loads — bulk save for one semester + school year. Returns the backend message. */
async function createBulk(
  semId: number,
  syId: number,
  facultyLoads: FacultyLoadInput[],
): Promise<string> {
  const data = await apiPost<{ message?: string }>(
    `/deans/create-faculty-loads?sem_id=${semId}&sy_id=${syId}`,
    { facultyLoads },
  );
  return apiMessage(data);
}

type DepartmentFacultiesResponse = {
  department: string;
  firstName: string;
  midName: string | null;
  lastName: string;
  gender: string;
  civilStatus: string;
  email: string | null;
  mobile: string | null;
  roles: string[];
}[];

/** GET /deans/view-department-faculties — the dean's own department roster. */
async function listDepartmentFaculties(): Promise<DepartmentFacultyOption[]> {
  try {
    return await apiGet<DepartmentFacultiesResponse>("/deans/view-department-faculties");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

type DepartmentSubjectsResponse = {
  programName: string;
  programTotalUnits: number;
  curriculumDetails: {
    yearLevel: number;
    yearTotalUnits: number;
    semesterDetails: {
      semester: number;
      semesterTotalUnits: number;
      subjects: {
        subjectId: number;
        subjectCode: string;
        descriptiveTitle: string;
        units: number;
        prerequisites: { subjectCode: string }[];
      }[];
    }[];
  }[];
}[];

/**
 * GET /deans/view-department-subjects — the dean's own department curriculum tree.
 * The response only has program names, so program abbrevs are joined in from
 * programService.list() (the same trick curriculumService.getByProgram uses).
 */
async function listDepartmentSubjects(): Promise<DepartmentSubjectProgram[]> {
  let data: DepartmentSubjectsResponse;
  try {
    data = await apiGet<DepartmentSubjectsResponse>("/deans/view-department-subjects");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }

  const programs = await programService.list();

  return data.map((program) => {
    const match = programs.find((p) => p.name === program.programName);
    return {
      programAbbrev: match?.code ?? "",
      programName: program.programName,
      programTotalUnits: program.programTotalUnits,
      curriculumDetails: program.curriculumDetails.map((year) => ({
        yearLevel: year.yearLevel,
        yearTotalUnits: year.yearTotalUnits,
        semesterDetails: year.semesterDetails.map((sem) => ({
          semester: sem.semester,
          semesterTotalUnits: sem.semesterTotalUnits,
          subjects: sem.subjects.map((s) => ({
            subjectId: s.subjectId,
            subjectCode: s.subjectCode,
            descriptiveTitle: s.descriptiveTitle,
            units: s.units,
            prerequisites: s.prerequisites.map((p) => p.subjectCode),
          })),
        })),
      })),
    };
  });
}

type FacultyLoadsResponse = {
  teaching_term_id: number;
  programs: string[];
  department_abbrev: string;
  full_name: string;
  school_year: string;
  semester: string;
  loaded_subjects: {
    year_level: number;
    semester_category: number;
    subj_id: number;
    subject_code: string;
    desc_title: string;
    subject_units: number;
  }[];
  total_load_units: number;
  max_daily_hours: number;
  max_weekly_hours: number;
  current_weekly_hours: number;
  daily_loads: { day_of_week: number; current_daily_hours: number }[];
}[];

/**
 * GET /deans/view-faculty-loads — every existing teaching term for the dean's
 * department. Not filtered by term server-side; callers filter by schoolYear/semester.
 */
async function list(): Promise<FacultyLoadRecord[]> {
  let data: FacultyLoadsResponse;
  try {
    data = await apiGet<FacultyLoadsResponse>("/deans/view-faculty-loads");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((term) => ({
    teachingTermId: term.teaching_term_id,
    programs: term.programs,
    departmentAbbrev: term.department_abbrev,
    fullName: term.full_name,
    schoolYear: term.school_year,
    semester: term.semester,
    loadedSubjects: term.loaded_subjects.map(
      (s): LoadedSubject => ({
        yearLevel: s.year_level,
        semesterCategory: s.semester_category,
        subjectId: s.subj_id,
        subjectCode: s.subject_code,
        descriptiveTitle: s.desc_title,
        units: s.subject_units,
      }),
    ),
    totalLoadUnits: term.total_load_units,
    maxDailyHours: term.max_daily_hours,
    maxWeeklyHours: term.max_weekly_hours,
    currentWeeklyHours: term.current_weekly_hours,
    dailyLoads: term.daily_loads.map(
      (d): DailyLoad => ({ dayOfWeek: d.day_of_week, currentDailyHours: d.current_daily_hours }),
    ),
  }));
}

export const facultyLoadService = { createBulk, listDepartmentFaculties, listDepartmentSubjects, list };
