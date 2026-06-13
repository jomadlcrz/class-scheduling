import type { Semester } from "./subject";

export const SET_STATUSES = ["open", "closed", "cancelled"] as const;
export type SetStatus = (typeof SET_STATUSES)[number];

export const SET_STATUS_LABELS: Record<SetStatus, string> = {
  open: "Open",
  closed: "Closed",
  cancelled: "Cancelled",
};

/** Academic class set: one offering of a subject in a given term. */
export type ClassSet = {
  id: string;
  subjectId: string;
  /** Short label assigned per offering, e.g. "A", "B", "1A". */
  setCode: string;
  /** Academic year range, e.g. "2024-2025". */
  schoolYear: string;
  semester: Semester;
  /** Maximum enrollment slots. */
  capacity: number;
  status: SetStatus;
};

export type CreateSetInput = Omit<ClassSet, "id">;

export type UpdateSetInput = Partial<CreateSetInput>;
