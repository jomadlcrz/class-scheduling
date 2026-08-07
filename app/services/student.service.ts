import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut, apiUpload } from "~/lib/api";
import type {
  CreateStudentAccountInput,
  CreateStudentRecordInput,
  EnrollStudentInput,
  StudentAcademicRecord,
  StudentAccountRow,
  StudentAccountStatus,
  StudentProfileDetail,
  UpdateStudentProfileInput,
  UpdateEnrollmentInput,
} from "~/types/student";
import { semesterService } from "~/services/semester.service";
import { archiveService } from "~/services/archive.service";

/**
 * Student records (students module) and login accounts (super_admin module).
 */

/** POST /students — creates the profile, academic record, and enrolled subjects. */
async function createRecord(
  input: CreateStudentRecordInput,
): Promise<{ message: string; studentProfileId: number }> {
  const data = await apiPost<{ message?: string; student_profile_id: number }>("/students", {
    ...(input.studentId && { studentId: input.studentId }),
    firstName: input.firstName,
    ...(input.midName && { midName: input.midName }),
    lastName: input.lastName,
    mobile: input.mobile,
    email: input.email,
    academic: {
      programId: input.programId,
      yearLevel: input.yearLevel,
      ...(input.setId != null && { setId: input.setId }),
      studentType: input.studentType,
      enrolledStatus: input.enrolledStatus,
      syId: input.syId,
      semesterNumber: input.semesterNumber,
    },
    enrolledSubjects: input.subjectIds.map((subjectId) => ({ subjectId })),
  });
  return {
    message: apiMessage(data),
    studentProfileId: data.student_profile_id,
  };
}

/** POST /students/{id}/profile-photo — registrar upload for a student profile. */
async function uploadProfilePhoto(
  studentProfileId: number,
  file: File,
): Promise<{ url: string; message: string }> {
  const formData = new FormData();
  formData.append("photo", file);
  const data = await apiUpload<{ message?: string; profile_photo_url: string }>(
    `/students/${studentProfileId}/profile-photo`,
    formData,
  );
  return { url: data.profile_photo_url, message: data.message ?? "" };
}

/** POST /super-admin/create-student-accounts — emails temp password. Returns the backend message. */
async function createAccount(
  studentProfileId: number,
  input: CreateStudentAccountInput,
): Promise<string> {
  const data = await apiPost<{ message?: string }>(
    `/super-admin/create-student-accounts?student_profile_id=${studentProfileId}`,
    { email: input.email, roleName: input.roleName },
  );
  return apiMessage(data);
}

/** GET /super-admin/create-student-accounts — all student profiles. 404 → empty. */
async function listAccounts(): Promise<StudentAccountRow[]> {
  type StudentAccountResponse = {
    student_profile_id: number;
    student_id: string;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    mobile: string | null;
    email: string | null;
    has_account: boolean;
    academics: {
      student_academic_id: number;
      year_level: number;
      program: string;
      set: string | null;
      enrolled_status: string;
      student_type: string;
      school_year: string | null;
      semester: string | null;
      enrolled_subjects: {
        subject_id: number;
        subject_code: string;
        descriptive_title: string;
        units: number;
      }[];
    }[];
  };

  let data: StudentAccountResponse[];
  try {
    data = await apiGet<StudentAccountResponse[]>("/super-admin/create-student-accounts");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }

  return data.map((s) => ({
    studentProfileId: s.student_profile_id,
    studentId: s.student_id,
    firstName: s.first_name,
    midName: s.mid_name,
    lastName: s.last_name,
    mobile: s.mobile,
    email: s.email,
    hasAccount: s.has_account,
    academics: s.academics.map((a) => ({
      studentAcademicId: a.student_academic_id,
      yearLevel: a.year_level,
      program: a.program,
      set: a.set,
      enrolledStatus: a.enrolled_status,
      studentType: a.student_type,
      schoolYear: a.school_year,
      semester: a.semester,
      enrolledSubjects: a.enrolled_subjects.map((es) => ({
        subjectId: es.subject_id,
        subjectCode: es.subject_code,
        descriptiveTitle: es.descriptive_title,
        units: es.units,
      })),
    })),
  }));
}

/** POST /enrollments — re-enrolls an existing student profile into a new term. Returns the backend message. */
async function enroll(studentProfileId: number, input: EnrollStudentInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/enrollments", {
    studentProfileId,
    academic: {
      programId: input.programId,
      yearLevel: input.yearLevel,
      setId: input.setId,
      studentType: input.studentType,
      enrolledStatus: input.enrolledStatus,
      syId: input.syId,
      semesterNumber: input.semesterNumber,
    },
    enrolledSubjects: input.subjectIds.map((subjectId) => ({ subjectId })),
  });
  return apiMessage(data);
}

type EnrollmentHistoryResponse = {
  student_academic_id: number;
  year_level: number;
  program: string;
  set: string | null;
  enrolled_status: string;
  enrollment_state?: string | null;
  student_type: string;
  school_year: string | null;
  semester?: string | null;
  semester_number?: number | null;
  enrolled_subjects: {
    subject_id: number;
    subject_code: string;
    descriptive_title: string;
    units: number;
  }[];
}[];

/** GET /students/{id}/enrollments — every term this student has been enrolled in. */
async function getEnrollments(studentProfileId: number): Promise<StudentAcademicRecord[]> {
  const [data, semesters] = await Promise.all([
    apiGet<EnrollmentHistoryResponse>(`/students/${studentProfileId}/enrollments`),
    semesterService.list(),
  ]);
  const semesterLabels = new Map(
    semesters.map((semester) => [semester.semesterNumber, semester.displayName ?? semester.semester]),
  );
  return data.map((a) => ({
    studentAcademicId: a.student_academic_id,
    yearLevel: a.year_level,
    program: a.program,
    set: a.set,
    enrolledStatus: a.enrolled_status,
    enrollmentState: a.enrollment_state ?? null,
    studentType: a.student_type,
    schoolYear: a.school_year,
    semester:
      a.semester ??
      (a.semester_number != null ? semesterLabels.get(a.semester_number) ?? null : null),
    enrolledSubjects: a.enrolled_subjects.map((es) => ({
      subjectId: es.subject_id,
      subjectCode: es.subject_code,
      descriptiveTitle: es.descriptive_title,
      units: es.units,
    })),
  }));
}

/** GET /students/:id — one active student's editable personal profile. */
async function getProfile(studentProfileId: number): Promise<StudentProfileDetail> {
  const row = await apiGet<{
    student_profile_id: number;
    student_id: string | null;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    mobile: string | null;
    email: string | null;
    account_status: string;
    profile_photo_url: string | null;
  }>(`/students/${studentProfileId}`);

  return {
    studentProfileId: row.student_profile_id,
    studentId: row.student_id,
    firstName: row.first_name,
    midName: row.mid_name,
    lastName: row.last_name,
    mobile: row.mobile,
    email: row.email,
    accountStatus: row.account_status,
    profilePhotoUrl: row.profile_photo_url,
  };
}

/** PUT /students/:id — updates personal data without touching enrollment history. */
async function updateProfile(
  studentProfileId: number,
  input: UpdateStudentProfileInput,
): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/students/${studentProfileId}`, input);
  return apiMessage(data);
}

/** PUT /enrollments/<id> — corrects a single term's set/year level/status. */
async function updateEnrollment(studentAcademicId: number, input: UpdateEnrollmentInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/enrollments/${studentAcademicId}`, input);
  return apiMessage(data);
}

/** DELETE /enrollments/<id> — hard delete of a single term's enrollment. */
async function removeEnrollment(studentAcademicId: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/enrollments/${studentAcademicId}`);
  return apiMessage(data);
}

/** PATCH /enrollments/:id/state — changes enrollment state without deleting history. */
async function setEnrollmentState(studentAcademicId: number, state: string, reason?: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/enrollments/${studentAcademicId}/state`, {
    state,
    ...(reason ? { reason } : {}),
  });
  return apiMessage(data);
}

/** GET /super-admin/student-accounts/<id> */
async function getAccount(studentProfileId: number): Promise<StudentAccountStatus> {
  const d = await apiGet<{ student_profile_id: number; has_account: boolean; account_active: boolean | null }>(
    `/super-admin/student-accounts/${studentProfileId}`,
  );
  return { studentProfileId: d.student_profile_id, hasAccount: d.has_account, accountActive: d.account_active };
}

/** DELETE /super-admin/student-accounts/<id> — deactivates the login, not the profile. */
async function deactivateAccount(studentProfileId: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/super-admin/student-accounts/${studentProfileId}`);
  return apiMessage(data);
}

/** PATCH /super-admin/student-accounts/<id>/restore — reactivates the login. */
async function reactivateAccount(studentProfileId: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/super-admin/student-accounts/${studentProfileId}/restore`);
  return apiMessage(data);
}

type ImportStudentResult = {
  row: number;
  student_id?: string;
  status: "created" | "error";
  message?: string;
  errors?: Record<string, unknown>;
};

export type ImportStudentResponse = {
  total: number;
  created: number;
  failed: number;
  message?: string;
  results: ImportStudentResult[];
};

export type ImportStudentInput =
  | { input: CreateStudentRecordInput; error?: never }
  | { input?: never; error: string; studentId?: string };

/** Client-side batch over POST /students; spreadsheets are parsed in the browser. */
async function importRecords(rows: ImportStudentInput[]): Promise<ImportStudentResponse> {
  const results = await Promise.all(
    rows.map(async (row, index): Promise<ImportStudentResult> => {
      if (!row.input) {
        return {
          row: index + 1,
          student_id: row.studentId,
          status: "error",
          message: row.error,
        };
      }
      const input = row.input;
      try {
        const { message } = await createRecord(input);
        return {
          row: index + 1,
          student_id: input.studentId,
          status: "created",
          ...(message && { message }),
        };
      } catch (err) {
        return {
          row: index + 1,
          student_id: input.studentId,
          status: "error",
          message: err instanceof Error ? err.message : "",
        };
      }
    }),
  );
  const created = results.filter((result) => result.status === "created").length;
  return {
    total: rows.length,
    created,
    failed: results.length - created,
    results,
  };
}

export type StudentArchivePreview = {
  student: {
    student_profile_id: number;
    first_name: string;
    last_name: string;
  };
  archivable: boolean;
  blockers: Record<string, unknown>;
  willArchive: {
    academic_terms: number;
    enrolled_subjects: number;
    has_login_account: boolean;
    has_profile_photo?: boolean;
  };
};

type DeletedStudentProfile = {
  studentProfileId: number;
  firstName: string;
  lastName: string;
  deactivatedAt: string | null;
  academicTerms: number;
  enrolledSubjects: number;
  hasLoginAccount: boolean;
};

/** GET /students/:id/archive-preview */
async function getArchivePreview(studentProfileId: number): Promise<StudentArchivePreview> {
  return apiGet<StudentArchivePreview>(`/students/${studentProfileId}/archive-preview`);
}

/** PATCH /students/:id/archive — requires typing the student's full name. */
async function archiveProfile(studentProfileId: number, confirmFullName: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/students/${studentProfileId}/archive`, {
    confirm: confirmFullName,
  });
  return apiMessage(data);
}

/** GET /archive?category=students. */
async function listDeletedProfiles(): Promise<DeletedStudentProfile[]> {
  const items = await archiveService.listCategoryItems("students");
  return items.map((item) => ({
    studentProfileId: item.entityId,
    firstName: String(item.extra.first_name ?? ""),
    lastName: String(item.extra.last_name ?? ""),
    deactivatedAt: item.archivedAt,
    academicTerms: Number(item.summary?.academic_terms ?? 0),
    enrolledSubjects: Number(item.summary?.enrolled_subjects ?? 0),
    hasLoginAccount: Boolean(item.summary?.has_login_account),
  }));
}

/** PATCH /archive/student/:id/restore — restores an archived student profile. */
async function restoreProfile(studentProfileId: number): Promise<string> {
  return archiveService.restore("student", studentProfileId);
}

export const studentService = {
  createRecord,
  uploadProfilePhoto,
  createAccount,
  listAccounts,
  enroll,
  getEnrollments,
  getProfile,
  updateProfile,
  updateEnrollment,
  removeEnrollment,
  setEnrollmentState,
  getAccount,
  deactivateAccount,
  reactivateAccount,
  importRecords,
  getArchivePreview,
  archiveProfile,
  listDeletedProfiles,
  restoreProfile,
};
