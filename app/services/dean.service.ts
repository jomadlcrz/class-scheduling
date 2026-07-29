import { ApiError, apiDelete, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
import { facultyService } from "~/services/faculty.service";
import type { CreateFacultyAccountInput, Faculty } from "~/types/faculty";
import type {
  DepartmentSubjectProgram,
  FacultyLoadingEntry,
  FacultyLoadingResponse,
  SubjectAssignment,
  TeachingTerm,
  TeachingTermDetail,
} from "~/types/faculty-load";

type DepartmentInstructorsResponse = {
  instructor_profile_id: number;
  profile_photo_url: string | null;
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
  instructorProfileId: number;
  profilePhotoUrl: string | null;
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
    instructorProfileId: i.instructor_profile_id,
    profilePhotoUrl: i.profile_photo_url,
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
    teachingTermId: null,
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
    instructorProfileId: number;
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

/** GET /deans/teaching-terms — all teaching terms visible to the caller (dean: own department). */
async function listTeachingTerms(params?: {
  syId?: number;
  semId?: number;
}): Promise<TeachingTerm[]> {
  const query = new URLSearchParams();
  if (params?.syId != null) query.set("sy_id", String(params.syId));
  if (params?.semId != null) query.set("sem_id", String(params.semId));
  const qs = query.toString();
  const data = await apiGet<{
    teaching_term_id: number;
    instructor: {
      instructor_profile_id: number;
      full_name: string | null;
      department: string | null;
    };
    hours: {
      max_weekly_hours: number;
      current_weekly_hours: number;
    };
    subject_assignments: {
      subject_assignment_id: number;
      curriculum_detail_id: number;
      subject_code: string | null;
      program_abbrev: string | null;
      descriptive_title: string | null;
      units: number;
      lec_hours: number;
      lab_hours: number;
    }[];
    programs: {
      program_abbrev: string | null;
      program_name: string | null;
      subjects: {
        subject_assignment_id: number;
        curriculum_detail_id: number;
        subject_code: string | null;
      }[];
    }[];
  }[]>(`/deans/teaching-terms${qs ? `?${qs}` : ""}`);
  return data.map((t) => ({
    id: t.teaching_term_id,
    instructorProfileId: t.instructor?.instructor_profile_id ?? 0,
    instructorName: t.instructor?.full_name ?? "",
    department: t.instructor?.department ?? "",
    syId: params?.syId ?? 0,
    semId: params?.semId ?? 0,
    maxWeeklyHours: t.hours?.max_weekly_hours ?? 0,
    currentWeeklyHours: t.hours?.current_weekly_hours ?? 0,
    subjectAssignments: (t.subject_assignments ?? []).map((sa) => ({
      subjectAssignmentId: sa.subject_assignment_id,
      curriculumDetailId: sa.curriculum_detail_id,
      subjectCode: sa.subject_code ?? "",
      programAbbrev: sa.program_abbrev ?? "",
      descriptiveTitle: sa.descriptive_title ?? "",
      units: sa.units ?? 0,
      lecHours: sa.lec_hours ?? 0,
      labHours: sa.lab_hours ?? 0,
    })),
    programs: (t.programs ?? []).map((p) => ({
      programAbbrev: p.program_abbrev ?? "",
      programName: p.program_name ?? "",
      subjects: (p.subjects ?? []).map((s) => ({
        subjectAssignmentId: s.subject_assignment_id,
        curriculumDetailId: s.curriculum_detail_id,
        subjectCode: s.subject_code ?? "",
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

/** PUT /deans/teaching-terms/<id> — updates maxWeeklyHours and/or assigned subjects (curriculumDetailIds).
 *  Returns the backend message plus the full updated term so callers can patch local state without a refetch. */
async function updateTeachingTerm(
  id: number,
  input: { maxWeeklyHours?: number; curriculumDetailIds?: number[] },
): Promise<{ message: string; term: TeachingTermDetail | null }> {
  const data = await apiPut<{ message?: string; teaching_term?: TeachingTermDetail }>(
    `/deans/teaching-terms/${id}`,
    input,
  );
  return { message: apiMessage(data), term: data.teaching_term ?? null };
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

/** DELETE /deans/teaching-terms/<tid>/subject-assignments/<aid> — per-row removal. */
async function removeSubjectAssignment(teachingTermId: number, assignmentId: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(
    `/deans/teaching-terms/${teachingTermId}/subject-assignments/${assignmentId}`,
  );
  return apiMessage(data);
}

/** DELETE /deans/teaching-terms/<id>[?cascade=true] — removes term and optionally its assignments. */
async function deleteTeachingTerm(id: number, cascade = false): Promise<string> {
  const qs = cascade ? "?cascade=true" : "";
  const data = await apiDelete<{ message?: string }>(`/deans/teaching-terms/${id}${qs}`);
  return apiMessage(data);
}

type DepartmentProgramResponse = {
  department: {
    department_id: number;
    department_abbrev: string;
    department_name: string;
  };
  total_programs: number;
  programs: {
    program_id: number;
    program_abbrev: string;
    program_name: string;
    program_type: string;
    program_length: number;
    total_subjects: number;
    total_units: number;
    subjects: {
      curriculum_detail_id: number;
      subject_id: number;
      subject_code: string;
      descriptive_title: string;
      units: number;
      subject_type: string | null;
      year_level: number;
      semester_category: number;
    }[];
  }[];
};

/** GET /deans/department/programs — programs under the dean's own department. */
async function listDepartmentPrograms(): Promise<{
  abbrev: string;
  name: string;
}[]> {
  let data: DepartmentProgramResponse;
  try {
    data = await apiGet<DepartmentProgramResponse>("/deans/department/programs");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.programs.map((p) => ({ abbrev: p.program_abbrev, name: p.program_name }));
}

/** GET /deans/teaching-terms/<id> — full rich payload with daily loads, sessions, utilization. */
async function getTeachingTermDetail(id: number): Promise<TeachingTermDetail> {
  return apiGet<TeachingTermDetail>(`/deans/teaching-terms/${id}`);
}

export const deanService = {
  list,
  create,
  listDepartmentInstructors,
  listDepartmentSubjects,
  listDepartmentPrograms,
  getFacultyLoading,
  createSubjectAssignments,
  listTeachingTerms,
  getTeachingTerm,
  getTeachingTermDetail,
  updateTeachingTerm,
  removeTeachingTerm,
  deleteTeachingTerm,
  getSubjectAssignment,
  removeSubjectAssignment,
};
