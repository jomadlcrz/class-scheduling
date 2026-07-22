import { ApiError, apiDelete, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
import { programService } from "~/services/program.service";
import type {
  DepartmentFacultyOption,
  DepartmentSubjectProgram,
  FacultyLoadInput,
  FacultyLoadingEntry,
  SubjectAssignment,
  TeachingTerm,
} from "~/types/faculty-load";

/**
 * Faculty loading service (deans module). The backend matches faculty by
 * first/last name and resolves subjects per program abbreviation.
 */

/** POST /deans/subject-assignments — bulk save for one semester + school year. Returns the backend message. */
async function createSubjectAssignments(
  syId: number,
  semId: number,
  instructorLoads: FacultyLoadInput[],
): Promise<string> {
  const data = await apiPost<{ message?: string }>("/deans/subject-assignments", {
    instructorLoads,
    syId,
    semId,
  });
  return apiMessage(data);
}

type DepartmentInstructorsResponse = {
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

/** GET /deans/instructors — the dean's own department roster. */
async function listDepartmentFaculties(): Promise<DepartmentFacultyOption[]> {
  try {
    return await apiGet<DepartmentInstructorsResponse>("/deans/instructors");
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
 * GET /deans/subjects — the dean's own department curriculum tree.
 * The response only has program names, so program abbrevs are joined in from
 * programService.list() (the same trick curriculumService.getByProgram uses).
 */
async function listDepartmentSubjects(): Promise<DepartmentSubjectProgram[]> {
  let data: DepartmentSubjectsResponse;
  try {
    data = await apiGet<DepartmentSubjectsResponse>("/deans/subjects");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }

  const programs = await programService.list();

  return data.map((program) => {
    const match = programs.find((p) => p.name === program.programName);
    return {
      programAbbrev: match?.abbrev ?? "",
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

type FacultyLoadingResponse = {
  instructor_name: string;
  department: string;
  semester: string;
  academic_year: string;
  max_weekly_hours: number | string | null;
  subjects: {
    subject_code: string;
    descriptive_title: string;
    units: { total: number; lec_hours: number; lab_hours: number };
    schedules: {
      day: string;
      time: string;
      number_of_students: number;
      course: string;
      year_level: number;
      set_code: string;
      room: string | null;
    }[];
  }[];
}[];

/**
 * GET /deans/faculty-loading — the loading sheet for one term (requires
 * sy_id + sem_id). Unlike every other dean endpoint this one is hand-built
 * snake_case JSON, not a marshmallow schema with camelCase data_keys — map
 * it by hand rather than assuming the usual auto-camelCase convention.
 */
async function getFacultyLoading(syId: number, semId: number): Promise<FacultyLoadingEntry[]> {
  let data: FacultyLoadingResponse;
  try {
    data = await apiGet<FacultyLoadingResponse>(
      `/deans/faculty-loading?sy_id=${syId}&sem_id=${semId}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((entry) => ({
    instructorName: entry.instructor_name,
    department: entry.department,
    semester: entry.semester,
    academicYear: entry.academic_year,
    // Loose null check: the backend currently omits this field entirely rather than
    // sending null, so `undefined` must map to `null` too or Number(undefined) → NaN.
    maxWeeklyHours: entry.max_weekly_hours == null ? null : Number(entry.max_weekly_hours),
    subjects: entry.subjects.map((s) => ({
      subjectCode: s.subject_code,
      descriptiveTitle: s.descriptive_title,
      units: { total: s.units.total, lecHours: s.units.lec_hours, labHours: s.units.lab_hours },
      schedules: s.schedules.map((sc) => ({
        day: sc.day,
        time: sc.time,
        numberOfStudents: sc.number_of_students,
        course: sc.course,
        yearLevel: sc.year_level,
        setCode: sc.set_code,
        room: sc.room,
      })),
    })),
  }));
}

/** GET /deans/teaching-terms/<id> — one instructor's term-scoped load record. */
async function getTeachingTerm(id: number): Promise<TeachingTerm> {
  const data = await apiGet<{
    id: number;
    instructor_profile_id: number;
    instructor_name: string;
    sy_id: number;
    sem_id: number;
    max_weekly_hours: number | string;
    current_weekly_hours: number | string;
  }>(`/deans/teaching-terms/${id}`);
  return {
    id: data.id,
    instructorProfileId: data.instructor_profile_id,
    instructorName: data.instructor_name,
    syId: data.sy_id,
    semId: data.sem_id,
    maxWeeklyHours: Number(data.max_weekly_hours),
    currentWeeklyHours: Number(data.current_weekly_hours),
  };
}

/** PUT /deans/teaching-terms/<id> — updates only the max weekly hours cap. */
async function updateTeachingTerm(id: number, maxWeeklyHours: number): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/deans/teaching-terms/${id}`, { maxWeeklyHours });
  return apiMessage(data);
}

/** DELETE /deans/teaching-terms/<id> — 409 if the term still has subject assignments. */
async function removeTeachingTerm(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/deans/teaching-terms/${id}`);
  return apiMessage(data);
}

/** GET /deans/subject-assignments/<id> — one subject-assignment link row. */
async function getSubjectAssignment(id: number): Promise<SubjectAssignment> {
  const data = await apiGet<{
    id: number;
    teaching_term_id: number;
    curriculum_detail_id: number;
    subject_code: string;
  }>(`/deans/subject-assignments/${id}`);
  return {
    id: data.id,
    teachingTermId: data.teaching_term_id,
    curriculumDetailId: data.curriculum_detail_id,
    subjectCode: data.subject_code,
  };
}

/** DELETE /deans/subject-assignments/<id> — hard delete of the link row. */
async function removeSubjectAssignment(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/deans/subject-assignments/${id}`);
  return apiMessage(data);
}

export const facultyLoadService = {
  createSubjectAssignments,
  listDepartmentFaculties,
  listDepartmentSubjects,
  getFacultyLoading,
  getTeachingTerm,
  updateTeachingTerm,
  removeTeachingTerm,
  getSubjectAssignment,
  removeSubjectAssignment,
};
