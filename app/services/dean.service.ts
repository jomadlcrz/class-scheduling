import { ApiError, apiDelete, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import { facultyService } from "~/services/faculty.service";
import type { CreateFacultyAccountInput, Faculty } from "~/types/faculty";
import type { AttentionItem, DeanAnalyticsResponse, InstructorLoad } from "~/types/dean-analytics";
import type { OfferingCoverage } from "~/types/offering-coverage";
import type {
  DepartmentSubjectProgram,
  FacultyLoadingEntry,
  FacultyLoadingResponse,
  TeachingTerm,
  TeachingTermDetail,
} from "~/types/faculty-load";

type DepartmentInstructorsResponse = {
  instructor_profile_id: number;
  employee_id: string | null;
  profile_photo_url: string | null;
  department: string;
  first_name: string;
  mid_name: string | null;
  last_name: string;
  gender: string;
  civil_status: string;
  employment_status?: string;
  prefix_honorific?: string;
  academic_rank?: string | null;
  email: string | null;
  mobile: string | null;
  roles: string[];
}[];

export type DeanAttentionPage = {
  items: AttentionItem[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type DeanInstructorLoadsPage = {
  items: InstructorLoad[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type DepartmentInstructor = {
  instructorProfileId: number;
  employeeId: string | null;
  profilePhotoUrl: string | null;
  department: string;
  firstName: string;
  midName: string | null;
  lastName: string;
  gender: string;
  civilStatus: string;
  employmentStatus: string;
  prefixHonorific: string;
  academicRank: string | null;
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
      semester_number: number;
      semester_total_units: number;
      subjects: {
        curriculum_detail_id: number;
        subject_id: number;
        subject_code: string;
        descriptive_title: string;
        units: number;
        prerequisites: { subject_code: string }[];
      }[];
    }[];
  }[];
}[];

/** GET /deans/instructors — the dean's own department instructor roster (or scoped by departmentId for registrar). */
async function listDepartmentInstructors(params?: {
  departmentId?: number | null;
}): Promise<DepartmentInstructor[]> {
  const query = new URLSearchParams();
  if (params?.departmentId != null) query.set("department_id", String(params.departmentId));
  const qs = query.toString();
  let raw: DepartmentInstructorsResponse;
  try {
    raw = await apiGet<DepartmentInstructorsResponse>(`/deans/instructors${qs ? `?${qs}` : ""}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return raw.map((i) => ({
    instructorProfileId: i.instructor_profile_id,
    employeeId: i.employee_id,
    profilePhotoUrl: i.profile_photo_url,
    department: i.department,
    firstName: i.first_name,
    midName: i.mid_name,
    lastName: i.last_name,
    gender: i.gender,
    civilStatus: i.civil_status,
    employmentStatus: i.employment_status ?? "N/A",
    prefixHonorific: i.prefix_honorific ?? "N/A",
    academicRank: i.academic_rank ?? null,
    email: i.email,
    mobile: i.mobile,
    roles: i.roles,
  }));
}

/**
 * GET /deans/curricula — the dean's own department curriculum tree (or scoped by departmentId for registrar).
 * Uses the program name directly (no /programs call — deans may lack programs:read).
 */
async function listDepartmentSubjects(params?: {
  semesterNumber?: number | null;
  departmentId?: number | null;
}): Promise<DepartmentSubjectProgram[]> {
  const query = new URLSearchParams();
  if (params?.semesterNumber) {
    query.set("semester_number", String(params.semesterNumber));
  }
  if (params?.departmentId != null) {
    query.set("department_id", String(params.departmentId));
  }
  const qs = query.toString();
  const path = qs ? `/deans/curricula?${qs}` : "/deans/curricula";
  let data: DepartmentSubjectsResponse;
  try {
    data = await apiGet<DepartmentSubjectsResponse>(path);
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
        semester: sem.semester_number,
        semesterTotalUnits: Number(sem.semester_total_units),
        subjects: sem.subjects.map((s) => ({
          curriculumDetailId: s.curriculum_detail_id,
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
async function getFacultyLoading(syId: number, semesterNumber: number): Promise<FacultyLoadingEntry[]> {
  let data: FacultyLoadingResponse;
  try {
    data = await apiGet<FacultyLoadingResponse>(
      `/deans/faculty-loading${termScopeQuery(syId, semesterNumber)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((entry) => ({
    instructorName: entry.instructor_name,
    employeeId: null,
    department: entry.department,
    semester: entry.semester,
    academicTerm: entry.academic_year,
    maxWeeklyHours: null,
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

/** POST /deans/subject-assignments — one POST per instructor. */
async function createSubjectAssignments(
  syId: number,
  semesterNumber: number,
  instructorLoads: {
    instructorProfileId: number;
    maxWeeklyHours: number;
    programs: {
      programId: number;
      subjects: { subjectId: number }[];
    }[];
  }[],
): Promise<string> {
  const messages: string[] = [];
  for (const load of instructorLoads) {
    const data = await apiPost<{ message?: string }>("/deans/subject-assignments", {
      instructorProfileId: load.instructorProfileId,
      maxWeeklyHours: load.maxWeeklyHours,
      programs: load.programs,
      syId,
      semesterNumber,
    });
    const msg = apiMessage(data);
    if (msg) messages.push(msg);
  }
  return messages.join(" ") || "Assignments saved.";
}

/** GET /deans/teaching-terms — all teaching terms visible to the caller (dean: own department, registrar: scoped by departmentId if provided). */
async function listTeachingTerms(params?: {
  syId?: number;
  semesterNumber?: number;
  departmentId?: number | null;
}): Promise<TeachingTerm[]> {
  const query = new URLSearchParams();
  if (params?.syId != null) query.set("sy_id", String(params.syId));
  if (params?.semesterNumber != null) query.set("semester_number", String(params.semesterNumber));
  if (params?.departmentId != null) query.set("department_id", String(params.departmentId));
  const qs = query.toString();
  const data = await apiGet<TeachingTermDetail[]>(`/deans/teaching-terms${qs ? `?${qs}` : ""}`);
  return data.map((t) => ({
    id: t.teaching_term_id,
    instructorProfileId: t.instructor?.instructor_profile_id ?? 0,
    instructorName: t.instructor?.full_name ?? "",
    employeeId: t.instructor?.employee_id ?? null,
    department: t.instructor?.department ?? "",
    syId: t.term?.sy_id ?? 0,
    semesterNumber: t.term?.semester_number ?? 0,
    maxWeeklyHours: t.hours?.max_weekly_hours ?? 0,
    currentWeeklyHours: t.hours?.current_weekly_hours ?? 0,
    loadClassification: t.hours?.load_classification ?? null,
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
      programId: p.program_id,
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

/** DELETE /deans/teaching-terms/<id>[?cascade=true&confirmation=REMOVE] — removes term and optionally its assignments. */
async function deleteTeachingTerm(id: number, cascade = false): Promise<string> {
  const qs = cascade ? "?cascade=true&confirmation=REMOVE" : "";
  const data = await apiDelete<{ message?: string }>(`/deans/teaching-terms/${id}${qs}`);
  return apiMessage(data);
}

type RemoveSubjectAssignmentResponse = {
  message: string;
  teaching_term_deleted: boolean;
};

/** DELETE /deans/teaching-terms/<tid>/subject-assignments/<aid> — per-row removal. */
async function removeSubjectAssignment(
  teachingTermId: number,
  assignmentId: number,
): Promise<RemoveSubjectAssignmentResponse> {
  return apiDelete<RemoveSubjectAssignmentResponse>(
    `/deans/teaching-terms/${teachingTermId}/subject-assignments/${assignmentId}`,
  );
}

type DepartmentProgramResponse = {
  department?: {
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
      semester_number: number;
    }[];
  }[];
};

/** GET /deans/department/programs — programs under the dean's own department. */
async function listDepartmentPrograms(semesterNumber?: number): Promise<{
  id: number;
  abbrev: string;
  name: string;
  subjects: {
    id: number;
    curriculumDetailId: number;
    code: string;
    title: string;
    units: number;
    yearLevel: number;
    semesterCategory: number;
    subjectType?: string | null;
  }[];
}[]> {
  let data: DepartmentProgramResponse;
  try {
    const query = semesterNumber != null ? `?semester_number=${semesterNumber}` : "";
    data = await apiGet<DepartmentProgramResponse>(`/deans/department/programs${query}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.programs.map((p) => ({
    id: p.program_id,
    abbrev: p.program_abbrev,
    name: p.program_name,
    subjects: p.subjects.map((s) => ({
      id: s.subject_id,
      curriculumDetailId: s.curriculum_detail_id,
      code: s.subject_code,
      title: s.descriptive_title,
      units: s.units,
      yearLevel: s.year_level,
      semesterCategory: s.semester_number,
      subjectType: s.subject_type,
    })),
  }));
}

/** GET /deans/teaching-terms/<id> — full rich payload with daily loads, sessions, utilization. */
async function getTeachingTermDetail(id: number): Promise<TeachingTermDetail> {
  return apiGet<TeachingTermDetail>(`/deans/teaching-terms/${id}`);
}

type DeanStudentEnrollment = {
  enrollment_id: number;
  student_profile_id: number;
  student_type: string;
  year_level: number;
  enrolled_status: string;
  enrollment_state: string;
  program: string;
  set: string | null;
  semester_name: string;
  sy_id: number;
  term_closed: boolean;
  subjects: {
    subject_id: number;
    subject_code: string | null;
    descriptive_title: string | null;
    units: number | null;
  }[];
};

/** GET /deans/students/<id>/enrollments — one student's enrollment history scoped to the dean's department. */
async function getStudentEnrollments(studentProfileId: number): Promise<DeanStudentEnrollment[]> {
  return apiGet<DeanStudentEnrollment[]>(`/deans/students/${studentProfileId}/enrollments`);
}

/** POST /deans/subject-assignments — update cap for an existing teaching term.
 *  The backend re-applies max_weekly_hours on every POST to this endpoint. */
async function updateMaxWeeklyHours(
  syId: number,
  semesterNumber: number,
  instructorProfileId: number,
  maxWeeklyHours: number,
): Promise<string> {
  const data = await apiPost<{ message?: string }>("/deans/subject-assignments", {
    instructorProfileId,
    maxWeeklyHours: maxWeeklyHours,
    programs: [],
    syId,
    semesterNumber,
  });
  return apiMessage(data);
}

/** GET /deans/analytics — the staffing dashboard for one term, render-ready. */
async function getAnalytics(syId: number, semesterNumber: number): Promise<DeanAnalyticsResponse> {
  return apiGet<DeanAnalyticsResponse>(`/deans/analytics${termScopeQuery(syId, semesterNumber)}`);
}

/** GET /deans/analytics/attention — items requiring the dean's immediate attention. */
async function getAttention(syId: number, semesterNumber: number): Promise<DeanAttentionPage> {
  return apiGet<DeanAttentionPage>(`/deans/analytics/attention${termScopeQuery(syId, semesterNumber)}`);
}

/** GET /deans/analytics/instructor-loads — per-instructor load breakdown for the term. */
async function getInstructorLoads(syId: number, semesterNumber: number): Promise<DeanInstructorLoadsPage> {
  return apiGet<DeanInstructorLoadsPage>(`/deans/analytics/instructor-loads${termScopeQuery(syId, semesterNumber)}`);
}

/** GET /deans/offering-coverage — which offerable minor/GenEd subjects still
 *  have no instructor for the term, grouped department → program. The backend
 *  scopes it by role (registrar: college-wide; dean: own department). Raw
 *  snake_case passthrough, like getAnalytics. Both sy_id and semester_number
 *  are required by the endpoint (400 otherwise), so callers always pass them. */
async function getOfferingCoverage(syId: number, semesterNumber: number): Promise<OfferingCoverage> {
  return apiGet<OfferingCoverage>(`/deans/offering-coverage${termScopeQuery(syId, semesterNumber)}`);
}

export type SchedulingLoadPolicy = {
  syId: number;
  semesterNumber: number;
  normalLoadHours: number;
  regularDailyCap: number;
  overloadDailyCap: number;
  isDefault: boolean;
  isClosed: boolean;
  guidelines: string[];
};

type SchedulingLoadPolicyResponse = {
  sy_id: number;
  semester_number: number;
  normal_load_hours: number;
  regular_daily_cap: number;
  overload_daily_cap: number;
  is_default: boolean;
  is_closed: boolean;
  guidelines: string[];
  message?: string;
};

function mapSchedulingLoadPolicy(data: SchedulingLoadPolicyResponse): SchedulingLoadPolicy {
  return {
    syId: data.sy_id,
    semesterNumber: data.semester_number,
    normalLoadHours: data.normal_load_hours,
    regularDailyCap: data.regular_daily_cap,
    overloadDailyCap: data.overload_daily_cap,
    isDefault: data.is_default,
    isClosed: data.is_closed,
    guidelines: data.guidelines ?? [],
  };
}

async function getSchedulingLoadPolicy(syId: number, semesterNumber: number): Promise<SchedulingLoadPolicy> {
  const data = await apiGet<SchedulingLoadPolicyResponse>(
    `/deans/scheduling-load-policy${termScopeQuery(syId, semesterNumber)}`,
  );
  return mapSchedulingLoadPolicy(data);
}

async function updateSchedulingLoadPolicy(input: {
  syId: number;
  semesterNumber: number;
  normalLoadHours: number;
  regularDailyCap: number;
  overloadDailyCap: number;
}): Promise<{ policy: SchedulingLoadPolicy; message: string }> {
  const data = await apiPut<SchedulingLoadPolicyResponse>("/deans/scheduling-load-policy", input);
  return { policy: mapSchedulingLoadPolicy(data), message: apiMessage(data) };
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
  getTeachingTermDetail,
  updateMaxWeeklyHours,
  deleteTeachingTerm,
  removeSubjectAssignment,
  getAnalytics,
  getAttention,
  getInstructorLoads,
  getOfferingCoverage,
  getSchedulingLoadPolicy,
  updateSchedulingLoadPolicy,
  getStudentEnrollments,
};
