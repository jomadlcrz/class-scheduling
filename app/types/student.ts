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
