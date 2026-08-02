import type { YearLevel } from "~/types/subject";

export const STUDENT_STATUSES = ["enrolled", "inactive", "graduated"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  enrolled: "Enrolled",
  inactive: "Inactive",
  graduated: "Graduated",
};

export type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  program: string;
  yearLevel: YearLevel;
  setCode: string;
  status: StudentStatus;
};

export type CreateStudentInput = Omit<Student, "id">;
export type UpdateStudentInput = Partial<CreateStudentInput>;

/** POST /students payload — creates the student profile + academic record. */
export type CreateStudentRecordInput = {
  studentId?: string;
  firstName: string;
  midName?: string;
  lastName: string;
  mobile: string;
  email: string;
  programId: number;
  yearLevel: number;
  setId: number;
  studentType: string;
  enrolledStatus: string;
  syId: number;
  semId: number;
  subjectIds: number[];
};

/** The backend only accepts the Student role on this endpoint. */
export type CreateStudentAccountInput = {
  email: string;
  roleName: "Student";
};

export type EnrolledSubjectRow = {
  subjectId: number;
  subjectCode: string;
  descriptiveTitle: string;
  units: number;
};

/** One academic term's record — enrolled subjects differ per term, so they nest here. */
export type StudentAcademicRecord = {
  studentAcademicId: number;
  yearLevel: number;
  program: string;
  set: string | null;
  enrolledStatus: string;
  studentType: string;
  schoolYear: string | null;
  semester: string | null;
  enrolledSubjects: EnrolledSubjectRow[];
};

export type StudentAccountRow = {
  studentProfileId: number;
  studentId: string | null;
  firstName: string;
  midName: string | null;
  lastName: string;
  studentName?: string;
  mobile: string | null;
  email: string | null;
  hasAccount: boolean;
  academics: StudentAcademicRecord[];
};

/** POST /students/{id}/enroll payload — re-enrolls an existing profile into a new term. */
export type EnrollStudentInput = {
  programId: number;
  yearLevel: number;
  setId: number;
  studentType: string;
  enrolledStatus: string;
  syId: number;
  semId: number;
  subjectIds: number[];
};

/** GET /students/regular row — same shape as StudentAccountRow but with the backend's display-string account status. */
export type RegularStudentRow = {
  studentProfileId: number;
  studentId: string | null;
  firstName: string;
  midName: string | null;
  lastName: string;
  studentName: string;
  mobile: string | null;
  email: string | null;
  accountStatus: string;
  academics: StudentAcademicRecord[];
};

/** GET /students/recycle-bin row — soft-deleted student profiles. */
export type DeletedStudent = {
  studentProfileId: number;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  deactivatedAt: string | null;
  academicTerms: number;
  enrolledSubjects: number;
  hasLoginAccount: boolean;
};

/** PUT /students/enrollments/<id> body — corrects a single term's set/year level/status; doesn't touch enrolled subjects. */
export type UpdateEnrollmentInput = {
  yearLevel?: number;
  setId?: number;
  enrolledStatus?: string;
};

/** GET /super-admin/student-accounts/<id> response, camelCased. */
export type StudentAccountStatus = {
  studentProfileId: number;
  hasAccount: boolean;
  accountActive: boolean | null;
};

/** Shape of GET /students/:id/delete-preview and the DELETE /students/:id payload.
 * Two-stage cascade: deleting only soft-deletes the profile and deactivates the
 * login account. Academic history and the S3 photo are untouched until the 30-day
 * recycle-bin purge, which restores nothing if the profile is restored in time. */
export type StudentDeletePreview = {
  student: {
    student_profile_id: number;
    first_name: string;
    last_name: string;
  };
  will_delete: {
    /** Per-term enrollment records — kept untouched for the recycle-bin window. */
    academic_terms: number;
    /** Enrolled-subject rows hanging off those terms — kept untouched. */
    enrolled_subjects: number;
    /** True when the profile has a login account (deactivated on delete, never deleted). */
    has_login_account: boolean;
    /** True when the profile has an S3 photo (deleted only at purge). */
    has_profile_photo: boolean;
  };
};
