import type { BadgeTone } from "../components/ui/badge";
import type { Semester } from "./subject";

export const ACADEMIC_SEMESTER_STATUSES = ["upcoming", "active", "completed", "archived"] as const;
export type AcademicSemesterStatus = (typeof ACADEMIC_SEMESTER_STATUSES)[number];

export const ACADEMIC_SEMESTER_STATUS_LABELS: Record<AcademicSemesterStatus, string> = {
  upcoming: "Upcoming",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

export const ACADEMIC_SEMESTER_STATUS_TONES: Record<AcademicSemesterStatus, BadgeTone> = {
  upcoming: "gold",
  active: "emerald",
  completed: "navy",
  archived: "slate",
};

export type AcademicSemester = {
  id: string;
  academicYearId: string;
  academicYearLabel: string;
  semester: Semester;
  status: AcademicSemesterStatus;
};

export type CreateAcademicSemesterInput = Omit<AcademicSemester, "id">;
export type UpdateAcademicSemesterInput = Partial<CreateAcademicSemesterInput>;
