import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut, apiUpload } from "~/lib/api";
import type {
  CreateStudentAccountInput,
  CreateStudentRecordInput,
  CreditedSubject,
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

function createRecordPayload(input: CreateStudentRecordInput) {
  return {
    ...(input.studentId && { studentId: input.studentId }),
    firstName: input.firstName,
    ...(input.midName && { midName: input.midName }),
    lastName: input.lastName,
    ...(input.suffix && { nameSuffix: input.suffix }),
    ...(input.gender && { gender: input.gender }),
    ...(input.birthdate && { birthdate: input.birthdate }),
    mobile: input.mobile,
    email: input.email,
    ...(input.address && { address: input.address }),
    academic: {
      programId: input.programId,
      yearLevel: input.yearLevel,
      ...(input.enrolledStatus !== "Irregular" && input.setId != null && { setId: input.setId }),
      studentType: input.studentType,
      enrolledStatus: input.enrolledStatus,
      syId: input.syId,
      semesterNumber: input.semesterNumber,
    },
    enrolledSubjects: input.subjectIds.map((subjectId) => ({ subjectId })),
  };
}

/** POST /students — creates the profile, academic record, and enrolled subjects. */
async function createRecord(
  input: CreateStudentRecordInput,
): Promise<{ message: string; studentProfileId: number }> {
  const data = await apiPost<{ message?: string; student_profile_id: number }>(
    "/students",
    createRecordPayload(input),
  );
  return {
    message: apiMessage(data),
    studentProfileId: data.student_profile_id,
  };
}

/** POST /students/bulk — creates every student in one all-or-nothing transaction. */
async function bulkCreateRecords(
  inputs: CreateStudentRecordInput[],
): Promise<{ message: string; created: number }> {
  const data = await apiPost<{ message?: string; created: number }>("/students/bulk", {
    students: inputs.map(createRecordPayload),
  });
  return { message: apiMessage(data), created: data.created };
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
    profile_photo_url: string | null;
    academics: {
      enrollment_id?: number;
      student_academic_id: number;
      year_level: number;
      program: string;
      set: string | null;
      enrolled_status: string;
      // Dropped from this endpoint's payload on 2026-08-08; kept optional for resilience.
      student_type?: string | null;
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
    profilePhotoUrl: s.profile_photo_url,
    academics: s.academics.map((a) => ({
      studentAcademicId: a.enrollment_id ?? a.student_academic_id,
      yearLevel: a.year_level,
      program: a.program,
      set: a.set,
      enrolledStatus: a.enrolled_status,
      studentType: a.student_type ?? null,
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
      ...(input.enrolledStatus !== "Irregular" && input.setId != null && { setId: input.setId }),
      studentType: input.studentType,
      enrolledStatus: input.enrolledStatus,
      syId: input.syId,
      semesterNumber: input.semesterNumber,
    },
    enrolledSubjects: input.subjectIds.map((subjectId) => ({ subjectId })),
  });
  return apiMessage(data);
}

type EnrollmentSubjectResponse = {
  subject_id: number;
  subject_code: string;
  descriptive_title: string;
  units: number;
};

type EnrollmentHistoryResponse = {
  enrollment_id?: number;
  student_academic_id: number;
  year_level: number;
  program: string;
  set: string | null;
  enrolled_status: string;
  enrollment_state?: string | null;
  student_type?: string | null;
  school_year: string | null;
  semester?: string | null;
  semester_number?: number | null;
  // `subjects` is the current key; `enrolled_subjects` is the retained alias.
  subjects?: EnrollmentSubjectResponse[];
  enrolled_subjects?: EnrollmentSubjectResponse[];
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
    studentAcademicId: a.enrollment_id ?? a.student_academic_id,
    yearLevel: a.year_level,
    program: a.program,
    set: a.set,
    enrolledStatus: a.enrolled_status,
    enrollmentState: a.enrollment_state ?? null,
    studentType: a.student_type ?? null,
    schoolYear: a.school_year,
    semester:
      a.semester ??
      (a.semester_number != null ? semesterLabels.get(a.semester_number) ?? null : null),
    enrolledSubjects: (a.subjects ?? a.enrolled_subjects ?? []).map((es) => ({
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
    suffix: string | null;
    gender: string | null;
    birthdate: string | null;
    mobile: string | null;
    email: string | null;
    account_status: string;
    profile_photo_url: string | null;
    address: {
      street: string | null;
      barangay: string | null;
      cityMunicipality: string | null;
      province: string | null;
      region: string | null;
      zipCode: string | null;
    } | null;
    credited_subjects: {
      subject_id: number;
      subject_code: string;
      descriptive_title: string;
    }[];
  }>(`/students/${studentProfileId}`);

  return {
    studentProfileId: row.student_profile_id,
    studentId: row.student_id,
    firstName: row.first_name,
    midName: row.mid_name,
    lastName: row.last_name,
    suffix: row.suffix ?? null,
    gender: row.gender ?? null,
    birthdate: row.birthdate ?? null,
    mobile: row.mobile,
    email: row.email,
    accountStatus: row.account_status,
    profilePhotoUrl: row.profile_photo_url,
    address: row.address
      ? {
          street: row.address.street,
          barangay: row.address.barangay,
          cityMunicipality: row.address.cityMunicipality,
          province: row.address.province,
          region: row.address.region,
          zipCode: row.address.zipCode,
        }
      : null,
    creditedSubjects: row.credited_subjects.map((cs): CreditedSubject => ({
      subjectId: cs.subject_id,
      subjectCode: cs.subject_code,
      descriptiveTitle: cs.descriptive_title,
    })),
  };
}

/** PUT /students/:id — updates personal data without touching enrollment history. */
async function updateProfile(
  studentProfileId: number,
  input: UpdateStudentProfileInput,
): Promise<string> {
  const { suffix, gender, birthdate, address, ...personal } = input;
  const data = await apiPut<{ message?: string }>(`/students/${studentProfileId}`, {
    ...personal,
    ...(suffix !== undefined && { nameSuffix: suffix }),
    ...(gender !== undefined && { gender }),
    ...(birthdate !== undefined && { birthdate }),
    ...(address && { address }),
  });
  return apiMessage(data);
}

/** PUT /enrollments/<id> — reassigns a regular enrollment's section (set). */
async function updateEnrollment(enrollmentId: number, input: UpdateEnrollmentInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/enrollments/${enrollmentId}`, {
    ...(input.setId != null && { setId: input.setId }),
  });
  return apiMessage(data);
}

/** DELETE /enrollments/<id> — hard delete of a single term's enrollment. */
async function removeEnrollment(enrollmentId: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/enrollments/${enrollmentId}`);
  return apiMessage(data);
}

/** PATCH /enrollments/:id/state — changes enrollment state without deleting history. */
async function setEnrollmentState(enrollmentId: number, state: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/enrollments/${enrollmentId}/state`, { state });
  return apiMessage(data);
}

/** GET /super-admin/student-accounts/<id> */
async function getAccount(studentProfileId: number): Promise<StudentAccountStatus> {
  const d = await apiGet<{ student_profile_id: number; has_account: boolean; account_active: boolean | null }>(
    `/super-admin/student-accounts/${studentProfileId}`,
  );
  return { studentProfileId: d.student_profile_id, hasAccount: d.has_account, accountActive: d.account_active };
}

/** DELETE /super-admin/student-accounts/<id> — deactivates the login, not the profile. Reason required. */
async function deactivateAccount(studentProfileId: number, reason: string): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/super-admin/student-accounts/${studentProfileId}`, { reason });
  return apiMessage(data);
}

/** PATCH /super-admin/student-accounts/<id>/restore — reactivates the login. Reason required. */
async function reactivateAccount(studentProfileId: number, reason: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/super-admin/student-accounts/${studentProfileId}/restore`, { reason });
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

export const studentService = {
  createRecord,
  bulkCreateRecords,
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
};
