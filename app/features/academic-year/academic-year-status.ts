import type { BadgeTone } from "~/components/ui/badge";

/**
 * The backend has no status field for academic periods — these are local,
 * mock-only UI labels (matching the old pre-backend academic-year prototype),
 * not a backend-truth enum.
 */
export const ACADEMIC_PERIOD_STATUSES = ["upcoming", "active", "completed", "archived"] as const;
export type AcademicPeriodStatus = (typeof ACADEMIC_PERIOD_STATUSES)[number];

export const ACADEMIC_PERIOD_STATUS_LABELS: Record<AcademicPeriodStatus, string> = {
  upcoming: "Upcoming",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

export const ACADEMIC_PERIOD_STATUS_TONES: Record<AcademicPeriodStatus, BadgeTone> = {
  upcoming: "gold",
  active: "emerald",
  completed: "navy",
  archived: "slate",
};
