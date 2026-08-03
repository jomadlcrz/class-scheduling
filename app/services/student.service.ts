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

/**
 * Student records (students module) and login accounts (super_admin module).
 */

/** POST /students — creates the profile, academic record, and enrolled subjects. Returns the backend message. */
async function createRecord(input: CreateStudentRecordInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/students", {
    ...(input.studentId && { studentId: input.studentId }),
    firstName: input.firstName,
    ...(input.midName && { midName: input.midName }),
    lastName: input.lastName,
    mobile: input.mobile,
    email: input.email,
    academic: {
      programId: input.programId,
      yearLevel: input.yearLevel,
      setId: input.setId,
      studentType: input.studentType,
      // Ignored by the current backend schema (unknown = EXCLUDE); sent for
      // when enrolledStatus is added to StudentAcademicSchema.
      enrolledStatus: input.enrolledStatus,
      syId: input.syId,
      semId: input.semId,
    },
    enrolledSubjects: input.subjectIds.map((subjectId) => ({ subjectId })),
  });
  return apiMessage(data);
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

/** POST /students/{id}/enroll — re-enrolls an existing student profile into a new term. Returns the backend message. */
async function enroll(studentProfileId: number, input: EnrollStudentInput): Promise<string> {
  const data = await apiPost<{ message?: string }>(`/students/${studentProfileId}/enroll`, {
    academic: {
      programId: input.programId,
      yearLevel: input.yearLevel,
      setId: input.setId,
      studentType: input.studentType,
      enrolledStatus: input.enrolledStatus,
      syId: input.syId,
      semId: input.semId,
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

/** PUT /students/enrollments/<id> — corrects a single term's set/year level/status. */
async function updateEnrollment(studentAcademicId: number, input: UpdateEnrollmentInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/students/enrollments/${studentAcademicId}`, input);
  return apiMessage(data);
}

/** DELETE /students/enrollments/<id> — hard delete of a single term's enrollment. */
async function removeEnrollment(studentAcademicId: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/students/enrollments/${studentAcademicId}`);
  return apiMessage(data);
}

/** PATCH /students/enrollments/:id/state — changes enrollment state without deleting history. */
async function setEnrollmentState(studentAcademicId: number, state: string, reason?: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/students/enrollments/${studentAcademicId}/state`, {
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

export type ImportStudentResult = {
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

/** POST /students/import — uploads a .csv or .xlsx file. */
async function importRecords(file: File): Promise<ImportStudentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<ImportStudentResponse>("/students/import", formData);
}

export const studentService = {
  createRecord,
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
};
