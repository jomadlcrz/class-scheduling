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
  studentId: string;
  firstName: string;
  midName: string | null;
  lastName: string;
  mobile: string | null;
  email: string | null;
  hasAccount: boolean;
  academics: StudentAcademicRecord[];
};
