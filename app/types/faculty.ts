import type { BadgeTone } from "~/components/ui/badge";

export const FACULTY_STATUSES = ["active", "inactive"] as const;
export type FacultyStatus = (typeof FACULTY_STATUSES)[number];

export const FACULTY_STATUS_LABELS: Record<FacultyStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const FACULTY_STATUS_TONES: Record<FacultyStatus, BadgeTone> = {
  active: "emerald",
  inactive: "slate",
};

export type Faculty = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  departmentCode: string;
  specialization: string;
  status: FacultyStatus;
  maxWeeklyHours: number;
};

export type CreateFacultyInput = Omit<Faculty, "id">;
export type UpdateFacultyInput = Partial<CreateFacultyInput>;

/** Backend enum values (app/enums.py). */
export const GENDERS = ["Male", "Female", "N/A"] as const;
export type Gender = (typeof GENDERS)[number];

export const CIVIL_STATUSES = ["Single", "Married", "Separated", "Widowed", "N/A"] as const;
export type CivilStatus = (typeof CIVIL_STATUSES)[number];

/** Creates the login account + faculty profile in one shot (temp password emailed). */
export type CreateFacultyAccountInput = {
  departmentId: number;
  firstName: string;
  midName?: string;
  lastName: string;
  email: string;
  mobile: string;
  gender: Gender;
  civilStatus: CivilStatus;
};
