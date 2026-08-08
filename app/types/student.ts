type EnrolledSubjectRow = {
  subjectId: number;
  subjectCode: string;
  descriptiveTitle: string;
  units: number;
};

/** POST /students payload — creates the student profile + academic record. */
export type CreateStudentRecordInput = {
  studentId?: string;
  firstName: string;
  midName?: string;
  lastName: string;
  /** Backend NameSuffix enum value (Jr., Sr., II, III, IV) — sent as `nameSuffix`. */
  suffix?: string;
  mobile: string;
  email: string;
  programId: number;
  yearLevel: number;
  setId?: number | null;
  studentType: string;
  enrolledStatus: string;
  syId: number;
  semesterNumber: number;
  subjectIds: number[];
};

/** The backend only accepts the Student role on this endpoint. */
export type CreateStudentAccountInput = {
  email: string;
  roleName: "Student";
};

/** One academic term's record — enrolled subjects differ per term, so they nest here. */
export type StudentAcademicRecord = {
  studentAcademicId: number;
  yearLevel: number;
  program: string;
  set: string | null;
  enrolledStatus: string;
  enrollmentState?: string | null;
  /** Nullable: the enrollment endpoints return it, but the super-admin account list no longer does. */
  studentType: string | null;
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

export type StudentProfileDetail = {
  studentProfileId: number;
  studentId: string | null;
  firstName: string;
  midName: string | null;
  lastName: string;
  suffix: string | null;
  mobile: string | null;
  email: string | null;
  accountStatus: string;
  profilePhotoUrl: string | null;
};

export type UpdateStudentProfileInput = {
  firstName: string;
  midName: string | null;
  lastName: string;
  /** Backend NameSuffix enum value or null to clear — sent as `nameSuffix`. */
  suffix?: string | null;
  mobile: string;
  email: string;
};

/** POST /enrollments payload — re-enrolls an existing profile into a new term. */
export type EnrollStudentInput = {
  programId: number;
  yearLevel: number;
  setId: number;
  studentType: string;
  enrolledStatus: string;
  syId: number;
  semesterNumber: number;
  subjectIds: number[];
};

/** GET /enrollments/regular row — same shape as StudentAccountRow but with the backend's display-string account status. */
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

/**
 * PUT /enrollments/<id> body — section (set) assignment only.
 * Year level and academic status are derived server-side and no longer editable here;
 * use PATCH /enrollments/<id>/state for enrollment state.
 */
export type UpdateEnrollmentInput = {
  setId?: number;
};

/** GET /super-admin/student-accounts/<id> response, camelCased. */
export type StudentAccountStatus = {
  studentProfileId: number;
  hasAccount: boolean;
  accountActive: boolean | null;
};
