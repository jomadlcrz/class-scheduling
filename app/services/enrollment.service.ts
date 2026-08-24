import { apiDelete, apiGet, apiGetFresh, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type {
  EnrollmentFacets,
  EnrollmentRow,
  EnrollmentStudent,
  EnrollmentSubjectLine,
  ReenrollDirectoryRow,
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
  gender: string | null;
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
    gender: s.gender,
    email: s.email,
    mobile: s.mobile,
    accountStatus: s.account_status,
    profilePhotoUrl: s.profile_photo_url,
    enrollments: (s.enrollments ?? []).map(toEnrollment),
  };
}

/** GET /enrollments — the term directory, regular + irregular combined. Returns paginated items. */
export type TermEnrollmentFilters = {
  search?: string;
  enrolledStatus?: string;
  program?: string;
  yearLevel?: string;
  set?: string;
  enrollmentState?: string;
};

async function listTermEnrollments(
  syId: number,
  semesterNumber: number,
  page = 1,
  perPage = 20,
  filters: TermEnrollmentFilters = {},
  audience: "registrar" | "dean" = "registrar",
): Promise<{
  items: EnrollmentStudent[];
  total: number;
  pages: number;
  currentPage: number;
}> {
  const query = new URLSearchParams(termScopeQuery(syId, semesterNumber).replace("?", ""));
  query.set("page", String(page));
  query.set("perPage", String(perPage));
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.enrolledStatus && filters.enrolledStatus !== "all") {
    query.set("enrolledStatus", filters.enrolledStatus);
  }
  if (filters.program && filters.program !== "all") query.set("program", filters.program);
  if (filters.yearLevel && filters.yearLevel !== "all") query.set("yearLevel", filters.yearLevel);
  if (filters.set && filters.set !== "all") query.set("set", filters.set);
  if (filters.enrollmentState && filters.enrollmentState !== "all") {
    query.set("enrollmentState", filters.enrollmentState);
  }
  const base = audience === "dean" ? "/deans/students" : "/enrollments";
  const data = await apiGetFresh<{
    items: ApiStudent[];
    pagination: { page: number; perPage: number; totalItems: number; totalPages: number };
  }>(`${base}?${query}`);
  return {
    items: (data.items ?? []).map(toStudent),
    total: data.pagination.totalItems,
    pages: data.pagination.totalPages,
    currentPage: data.pagination.page,
  };
}

/** GET /enrollments/facets — filter options and unfiltered term counts. */
async function getFacets(
  syId: number,
  semesterNumber: number,
  audience: "registrar" | "dean" = "registrar",
): Promise<EnrollmentFacets> {
  const base = audience === "dean" ? "/deans/students/facets" : "/enrollments/facets";
  const data = await apiGet<ApiFacets>(`${base}${termScopeQuery(syId, semesterNumber)}`);
  return { programs: data.programs ?? [], sets: data.sets ?? [], counts: data.counts };
}

async function getSetCapacity(): Promise<number> {
  const data = await apiGet<{ max_students_per_set: number }>("/enrollments/set-capacity");
  return data.max_students_per_set;
}

async function updateSetCapacity(maxStudentsPerSet: number): Promise<{ value: number; message: string }> {
  const data = await apiPut<{ message?: string; max_students_per_set: number }>(
    "/enrollments/set-capacity",
    { maxStudentsPerSet },
  );
  return { value: data.max_students_per_set, message: apiMessage(data) };
}

type BulkEnrollmentInput = {
  studentProfileId: number;
  programId: number;
  yearLevel: number;
  setId?: number;
  studentType: string;
  enrolledStatus: string;
  syId: number;
  semesterNumber: number;
  subjectIds: number[];
};

async function bulkCreate(inputs: BulkEnrollmentInput[]): Promise<{ created: number; message: string }> {
  const data = await apiPost<{ created: number; message?: string }>("/enrollments/bulk", {
    enrollments: inputs.map((input) => ({
      studentProfileId: input.studentProfileId,
      programId: input.programId,
      yearLevel: input.yearLevel,
      ...(input.setId != null && { setId: input.setId }),
      studentType: input.studentType,
      enrolledStatus: input.enrolledStatus,
      syId: input.syId,
      semesterNumber: input.semesterNumber,
      enrolledSubjects: input.subjectIds.map((subjectId) => ({ subjectId })),
    })),
  });
  return { created: data.created, message: apiMessage(data) };
}

type ApiReenrollRow = {
  student_profile_id: number;
  student_id: string | null;
  student_full_name: string;
  program: string | null;
  program_abbrev: string;
  year_level: number;
  set: string | null;
  last_school_year: string | null;
  last_semester_number: number;
  last_enrollment_state: string;
  enrolled_in_target_term: boolean;
  re_enroll_eligible: boolean;
  re_enroll_block_reason: string | null;
  enrolled_status: string;
  student_type: string | null;
  account_status: string;
  profile_photo_url: string | null;
};

export type ReenrollDirectoryFilters = {
  search?: string;
  program?: string;
  yearLevel?: string;
  semester?: string;
  enrolledStatus?: string;
};

export type ReenrollDirectoryPage = {
  items: ReenrollDirectoryRow[];
  total: number;
  pages: number;
  currentPage: number;
};

type ApiReenrollDirectoryBlock = {
  items: ApiReenrollRow[];
  pagination: { page: number; perPage: number; totalItems: number; totalPages: number };
};

function toReenrollRow(r: ApiReenrollRow): ReenrollDirectoryRow {
  return {
    studentProfileId: r.student_profile_id,
    studentId: r.student_id,
    name: r.student_full_name,
    program: r.program_abbrev || (r.program ?? ""),
    yearLevel: r.year_level,
    semesterNumber: r.last_semester_number,
    enrolledStatus: r.enrolled_status,
    studentType: r.student_type,
    set: r.set,
    lastSchoolYear: r.last_school_year,
    lastEnrollmentState: r.last_enrollment_state,
    reEnrollEligible: r.re_enroll_eligible,
    reEnrollBlockReason: r.re_enroll_block_reason,
    enrolledInTargetTerm: r.enrolled_in_target_term,
    accountStatus: r.account_status,
    profilePhotoUrl: r.profile_photo_url,
  };
}

/**
 * GET /enrollments/directory — returning students (one row per profile), with eligibility for the
 * target term. Server-paginated: the backend splits rows into `eligible` and `alreadyEnrolled`
 * blocks, each sliced by its own page. Both are requested for the same `page` and merged — the
 * blocks are disjoint, so dedupe guards against the backend clamping a block's page to its last
 * page when it runs out of pages before the other block.
 */
async function getReenrollDirectory(
  targetSyId: number | null,
  targetSemesterNumber: number | null,
  filters: ReenrollDirectoryFilters = {},
  page = 1,
  perPage = 10,
  directory: "eligible" | "already-enrolled" = "eligible",
): Promise<ReenrollDirectoryPage> {
  const query = new URLSearchParams();
  if (targetSyId != null && targetSemesterNumber != null) {
    const termQuery = new URLSearchParams(termScopeQuery(targetSyId, targetSemesterNumber).replace("?", ""));
    termQuery.forEach((value, key) => query.set(key, value));
  }
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.program && filters.program !== "all") query.set("program", filters.program);
  if (filters.yearLevel && filters.yearLevel !== "all") query.set("yearLevel", filters.yearLevel);
  if (filters.semester && filters.semester !== "all") {
    query.set("lastSemesterNumber", filters.semester);
  }
  if (filters.enrolledStatus && filters.enrolledStatus !== "all") {
    query.set("enrolledStatus", filters.enrolledStatus);
  }
  query.set("eligible_page", String(page));
  query.set("already_page", String(page));
  query.set("perPage", String(perPage));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  // The existing endpoint returns both blocks. Cache this raw response briefly
  // so switching between the Eligible and Already Enrolled routes does not
  // repeat the same expensive request. Any enrollment mutation clears apiGet's
  // cache, keeping the next directory visit current.
  const data = await apiGet<{
    eligible: ApiReenrollDirectoryBlock;
    alreadyEnrolled: ApiReenrollDirectoryBlock;
  }>(
    `/enrollments/directory${suffix}`,
  );
  const block = directory === "eligible" ? data?.eligible : data?.alreadyEnrolled;
  const resolvedBlock = block ?? { items: [], pagination: { page, perPage, totalItems: 0, totalPages: 1 } };
  return {
    items: resolvedBlock.items.map(toReenrollRow),
    total: resolvedBlock.pagination.totalItems,
    pages: resolvedBlock.pagination.totalPages,
    currentPage: resolvedBlock.pagination.page,
  };
}

async function getAlreadyEnrolledDirectory(
  targetSyId: number | null,
  targetSemesterNumber: number | null,
  filters: ReenrollDirectoryFilters = {},
  page = 1,
  perPage = 10,
): Promise<ReenrollDirectoryPage> {
  return getReenrollDirectory(
    targetSyId, targetSemesterNumber, filters, page, perPage, "already-enrolled",
  );
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

/** POST /enrollments/prerequisite-check — advisory prerequisite check (non-blocking). */
async function checkPrerequisites(input: {
  studentProfileId: number;
  syId: number;
  semesterNumber: number;
  subjectIds: number[];
}): Promise<{
  warnings: {
    subjectId: number;
    subjectCode: string | null;
    descriptiveTitle: string | null;
    missing: { subjectId: number; subjectCode: string | null; descriptiveTitle: string | null }[];
  }[];
}> {
  const data = await apiPost<{
    warnings: {
      subject_id: number;
      subject_code: string | null;
      descriptive_title: string | null;
      missing: { subject_id: number; subject_code: string | null; descriptive_title: string | null }[];
    }[];
  }>("/enrollments/prerequisite-check", {
    studentProfileId: input.studentProfileId,
    syId: input.syId,
    semesterNumber: input.semesterNumber,
    subjectIds: input.subjectIds,
  });
  return {
    warnings: data.warnings.map((w) => ({
      subjectId: w.subject_id,
      subjectCode: w.subject_code,
      descriptiveTitle: w.descriptive_title,
      missing: w.missing.map((m) => ({
        subjectId: m.subject_id,
        subjectCode: m.subject_code,
        descriptiveTitle: m.descriptive_title,
      })),
    })),
  };
}

export type EnrollmentRegistration = {
  enrolled: boolean;
  meta: {
    student_id: string | null;
    student_name: string | null;
    full_name: string | null;
    name_natural: string | null;
    enrolled_status?: string | null;
    program_abbrev?: string | null;
    program_name?: string | null;
    set_name?: string | null;
    year_level?: number | null;
    school_year?: string | null;
    semester_name?: string | null;
    registrar_name?: string | null;
  };
  summary: {
    total_subjects: number;
    total_units: number;
  };
  subjects: {
    subject_id: number;
    subject_code: string | null;
    descriptive_title: string | null;
    units: number | null;
    lec_hours: number | null;
    lab_hours: number | null;
  }[];
  schedule: {
    subject_code: string | null;
    day: string | null;
    start_time: string | null;
    end_time: string | null;
    room: string | null;
    instructor: string | null;
  }[];
};

/** GET /enrollments/<id>/registration — Certificate of Registration for one enrollment. */
async function getRegistration(enrollmentId: number): Promise<EnrollmentRegistration> {
  return apiGet<EnrollmentRegistration>(`/enrollments/${enrollmentId}/registration`);
}

export type AvailableSetPreview = {
  setId: number;
  setCode: string;
  setName: string;
  studentCount: number;
  capacity: number;
};

/** GET /enrollments/available-set — current automatic-placement preview for a Regular student. */
async function getAvailableSet(params: {
  programId: number;
  yearLevel: number;
  syId: number;
  semesterNumber: number;
  offset?: number;
}): Promise<AvailableSetPreview | null> {
  const query = new URLSearchParams({
    program_id: String(params.programId),
    year_level: String(params.yearLevel),
    sy_id: String(params.syId),
    semester_number: String(params.semesterNumber),
  });
  if (params.offset != null) query.set("offset", String(params.offset));
  const data = await apiGet<{
    set: {
      set_id: number;
      set_code: string;
      set_name: string;
      student_count: number;
      capacity: number;
    } | null;
  }>(`/enrollments/available-set?${query}`);
  if (!data?.set) return null;
  return {
    setId: data.set.set_id,
    setCode: data.set.set_code,
    setName: data.set.set_name,
    studentCount: data.set.student_count,
    capacity: data.set.capacity,
  };
}

export const enrollmentService = {
  listTermEnrollments,
  getFacets,
  getSetCapacity,
  updateSetCapacity,
  getAvailableSet,
  bulkCreate,
  getReenrollDirectory,
  getAlreadyEnrolledDirectory,
  getEnrollment,
  updateEnrollment,
  setEnrollmentState,
  deleteEnrollment,
  checkPrerequisites,
  getRegistration,
};

export type { UpdateEnrollmentInput };
export type { BulkEnrollmentInput };

