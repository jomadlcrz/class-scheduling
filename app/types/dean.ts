import type { BadgeTone } from "~/components/ui/badge";

export const DEAN_STATUSES = ["active", "inactive"] as const;
export type DeanStatus = (typeof DEAN_STATUSES)[number];

export const DEAN_STATUS_LABELS: Record<DeanStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const DEAN_STATUS_TONES: Record<DeanStatus, BadgeTone> = {
  active: "emerald",
  inactive: "slate",
};

export type Dean = {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  departmentCode: string;
  status: DeanStatus;
};

export type CreateDeanInput = Omit<Dean, "id">;
export type UpdateDeanInput = Partial<CreateDeanInput>;
