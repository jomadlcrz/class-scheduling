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

/** Creates the login account + faculty profile in one shot (temp password emailed). */
export type CreateFacultyAccountInput = {
  departmentId: number;
  firstName: string;
  midName?: string;
  lastName: string;
  email: string;
  mobile: string;
  /** Backend enum values fetched via enumService; omitted = "N/A" on the backend. */
  gender?: string;
  civilStatus?: string;
};
