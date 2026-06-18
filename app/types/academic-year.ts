import type { BadgeTone } from "../components/ui/badge";

export const ACADEMIC_YEAR_STATUSES = ["active", "upcoming", "archived"] as const;
export type AcademicYearStatus = (typeof ACADEMIC_YEAR_STATUSES)[number];

export const ACADEMIC_YEAR_STATUS_LABELS: Record<AcademicYearStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  archived: "Archived",
};

export const ACADEMIC_YEAR_STATUS_TONES: Record<AcademicYearStatus, BadgeTone> = {
  active: "emerald",
  upcoming: "gold",
  archived: "slate",
};

export type AcademicYear = {
  id: string;
  label: string;
  status: AcademicYearStatus;
};

export type CreateAcademicYearInput = Omit<AcademicYear, "id">;
export type UpdateAcademicYearInput = Partial<CreateAcademicYearInput>;
