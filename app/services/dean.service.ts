import { ApiError, apiDelete, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
import { facultyService } from "~/services/faculty.service";
import type { CreateFacultyAccountInput, Faculty } from "~/types/faculty";
import type {
  DepartmentSubjectProgram,
  FacultyLoadingEntry,
  FacultyLoadingResponse,
  SubjectAssignment,
  TeachingTerm,
} from "~/types/faculty-load";

type DepartmentInstructorsResponse = {
  department: string;
  first_name: string;
  mid_name: string | null;
  last_name: string;
  gender: string;
  civil_status: string;
  email: string | null;
  mobile: string | null;
  roles: string[];
}[];

export type DepartmentInstructor = {
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

// ── Admin dean account management (delegates to facultyService) ──────────────

/** List all dean accounts (admin/registrar portal). */
async function list(): Promise<Faculty[]> {
  const faculty = await facultyService.list();
  return faculty.filter((f) => f.roles.some((r) => r.name === "Dean"));
}

/** Create a dean login account (temp password emailed). */
async function create(input: Omit<CreateFacultyAccountInput, "roleName">): Promise<string> {
  return facultyService.create({ ...input, roleName: "Dean" });
}

type DepartmentSubjectsResponse = {
  program_name: string;
  program_total_units: number;
  curriculum_details: {
    year_level: number;
    year_total_units: number;
    semester_details: {
      semester: number;
      semester_total_units: number;
      subjects: {
        subject_id: number;
        subject_code: string;
        descriptive_title: string;
        units: number;
        prerequisites: { subject_code: string }[];
      }[];
    }[];
  }[];
}[];

/** GET /deans/instructors — the dean's own department instructor roster. */
async function listDepartmentInstructors(): Promise<DepartmentInstructor[]> {
  let raw: DepartmentInstructorsResponse;
  try {
    raw = await apiGet<DepartmentInstructorsResponse>("/deans/instructors");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return raw.map((i) => ({
    department: i.department,
    firstName: i.first_name,
    midName: i.mid_name,
    lastName: i.last_name,
    gender: i.gender,
    civilStatus: i.civil_status,
    email: i.email,
    mobile: i.mobile,
    roles: i.roles,
  }));
}

/**
 * GET /deans/subjects — the dean's own department curriculum tree.
 * Uses the program name directly (no /programs call — deans may lack programs:read).
 */
async function listDepartmentSubjects(): Promise<DepartmentSubjectProgram[]> {
  let data: DepartmentSubjectsResponse;
  try {
    data = await apiGet<DepartmentSubjectsResponse>("/deans/subjects");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }

  return data.map((program) => ({
    programAbbrev: "",
    programName: program.program_name,
    programTotalUnits: Number(program.program_total_units),
    curriculumDetails: program.curriculum_details.map((year) => ({
      yearLevel: year.year_level,
      yearTotalUnits: Number(year.year_total_units),
      semesterDetails: year.semester_details.map((sem) => ({
        semester: sem.semester,
        semesterTotalUnits: Number(sem.semester_total_units),
        subjects: sem.subjects.map((s) => ({
          subjectId: s.subject_id,
          subjectCode: s.subject_code,
          descriptiveTitle: s.descriptive_title,
          units: s.units,
          prerequisites: s.prerequisites.map((p) => p.subject_code),
        })),
      })),
    })),
  }));
}

/** GET /deans/faculty-loading — the loading sheet for one term. */
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

/** POST /deans/subject-assignments — bulk save for one semester + school year. */
async function createSubjectAssignments(
  syId: number,
  semId: number,
  instructorLoads: {
    firstName: string;
    lastName: string;
    maxWeeklyHours: number;
    programs: {
      programAbbrev: string;
      subjects: { subjectCode: string; descriptiveTitle: string }[];
    }[];
  }[],
): Promise<string> {
  const data = await apiPost<{ message?: string }>("/deans/subject-assignments", {
    instructorLoads,
    syId,
    semId,
  });
  return apiMessage(data);
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

export const deanService = {
  list,
  create,
  listDepartmentInstructors,
  listDepartmentSubjects,
  getFacultyLoading,
  createSubjectAssignments,
  getTeachingTerm,
  updateTeachingTerm,
  removeTeachingTerm,
  getSubjectAssignment,
  removeSubjectAssignment,
};
