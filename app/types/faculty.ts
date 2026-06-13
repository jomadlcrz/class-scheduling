import type { BadgeTone } from "../components/ui/badge";

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
};

export type CreateFacultyInput = Omit<Faculty, "id">;
export type UpdateFacultyInput = Partial<CreateFacultyInput>;
