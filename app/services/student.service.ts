import { ApiError, apiGet, apiPost } from "~/lib/api";
import type {
  CreateStudentAccountInput,
  CreateStudentRecordInput,
  StudentAccountRow,
} from "~/types/student";

/**
 * Student records (students module) and login accounts (super_admin module).
 */

/** POST /students — creates the profile, academic record, and enrolled subjects. */
async function createRecord(input: CreateStudentRecordInput): Promise<void> {
  await apiPost("/students", {
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
}

/** POST /super-admin/create-student-accounts — emails temp password. */
async function createAccount(
  studentProfileId: number,
  input: CreateStudentAccountInput,
): Promise<void> {
  await apiPost(
    `/super-admin/create-student-accounts?student_profile_id=${studentProfileId}`,
    { email: input.email, roleName: input.roleName },
  );
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
  }));
}

export const studentService = { createRecord, createAccount, listAccounts };
