import type { Semester, YearLevel } from "./subject";

export type SubjectOffering = {
  id: string;
  semesterId: string;
  academicYearId: string;
  academicYearLabel: string;
  semester: Semester;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  program: string;
  yearLevel: YearLevel;
  units: number;
};

export type CreateSubjectOfferingInput = Omit<SubjectOffering, "id">;
export type UpdateSubjectOfferingInput = Partial<CreateSubjectOfferingInput>;
