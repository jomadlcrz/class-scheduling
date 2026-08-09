import { apiDelete, apiGet, apiMessage, apiPatch, apiPut } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type {
  EnrollmentFacets,
  EnrollmentRow,
  EnrollmentStudent,
  EnrollmentSubjectLine,
} from "~/types/enrollment";

// --- Backend (snake_case) shapes, mapped to camelCase below (api.ts does not auto-convert). ---

type ApiSubject = {
  subject_id: number;
  subject_code: string | null;
  descriptive_title: string | null;
  units: number | null;
};

type ApiEnrollment = {
  enrollment_id: number;
  student_profile_id: number;
  year_level: number;
  program: string | null;
  set: string | null;
  enrolled_status: string;
  enrollment_state: string;
  student_type: string | null;
  school_year: string | null;
  semester_number: number;
  sy_id: number;
  term_closed: boolean;
  subjects: ApiSubject[];
};

type ApiStudent = {
  student_profile_id: number;
  student_id: string | null;
  student_full_name: string;
  mobile: string | null;
  email: string | null;
  account_status: string;
  profile_photo_url: string | null;
  enrollments: ApiEnrollment[];
};

type ApiFacets = {
  programs: string[];
  sets: string[];
  counts: EnrollmentFacets["counts"];
};

function toSubject(s: ApiSubject): EnrollmentSubjectLine {
  return {
    subjectId: s.subject_id,
    subjectCode: s.subject_code,
    descriptiveTitle: s.descriptive_title,
    units: s.units,
  };
}

function toEnrollment(e: ApiEnrollment): EnrollmentRow {
  return {
    enrollmentId: e.enrollment_id,
    studentProfileId: e.student_profile_id,
    yearLevel: e.year_level,
    program: e.program,
    set: e.set,
    enrolledStatus: e.enrolled_status,
    enrollmentState: e.enrollment_state,
    studentType: e.student_type,
    schoolYear: e.school_year,
    semesterNumber: e.semester_number,
    syId: e.sy_id,
    termClosed: e.term_closed,
    subjects: (e.subjects ?? []).map(toSubject),
  };
}

function toStudent(s: ApiStudent): EnrollmentStudent {
  return {
    studentProfileId: s.student_profile_id,
    studentId: s.student_id,
    name: s.student_full_name,
    email: s.email,
    mobile: s.mobile,
    accountStatus: s.account_status,
    profilePhotoUrl: s.profile_photo_url,
    enrollments: (s.enrollments ?? []).map(toEnrollment),
  };
}

/** GET /enrollments — the term directory, regular + irregular combined. */
async function listTermEnrollments(syId: number, semesterNumber: number): Promise<EnrollmentStudent[]> {
  const data = await apiGet<ApiStudent[]>(`/enrollments${termScopeQuery(syId, semesterNumber)}`);
  return (data ?? []).map(toStudent);
}

/** GET /enrollments/facets — filter options and unfiltered term counts. */
async function getFacets(syId: number, semesterNumber: number): Promise<EnrollmentFacets> {
  const data = await apiGet<ApiFacets>(`/enrollments/facets${termScopeQuery(syId, semesterNumber)}`);
  return { programs: data.programs ?? [], sets: data.sets ?? [], counts: data.counts };
}

/** GET /enrollments/{id} — one enrollment row with its subject load. */
async function getEnrollment(enrollmentId: number): Promise<EnrollmentRow> {
  const data = await apiGet<ApiEnrollment>(`/enrollments/${enrollmentId}`);
  return toEnrollment(data);
}

type UpdateEnrollmentInput = {
  /** null moves a regular student to irregular (no set); a number reassigns the section. */
  setId?: number | null;
  studentType?: string | null;
  /** Full subject-id list; omit to leave subjects unchanged. */
  subjects?: number[];
};

/** PUT /enrollments/{id} — section assignment / subject load. Returns the backend message. */
async function updateEnrollment(enrollmentId: number, input: UpdateEnrollmentInput): Promise<string> {
  const body: Record<string, unknown> = {};
  if (input.setId !== undefined) body.setId = input.setId;
  if (input.studentType !== undefined) body.studentType = input.studentType;
  if (input.subjects !== undefined) body.enrolledSubjects = input.subjects.map((subjectId) => ({ subjectId }));
  const data = await apiPut<{ message?: string }>(`/enrollments/${enrollmentId}`, body);
  return apiMessage(data);
}

/** PATCH /enrollments/{id}/state — Dropped / Withdrawn / Voided (allowed in closed terms). */
async function setEnrollmentState(enrollmentId: number, state: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/enrollments/${enrollmentId}/state`, { state });
  return apiMessage(data);
}

/** DELETE /enrollments/{id} — refused (409) in closed terms. */
async function deleteEnrollment(enrollmentId: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/enrollments/${enrollmentId}`);
  return apiMessage(data);
}

export const enrollmentService = {
  listTermEnrollments,
  getFacets,
  getEnrollment,
  updateEnrollment,
  setEnrollmentState,
  deleteEnrollment,
};

export type { UpdateEnrollmentInput };
