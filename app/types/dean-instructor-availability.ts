import type { AvailabilityWindow } from "~/types/instructor-availability";

export type { AvailabilityWindow };

export type AvailabilityReviewState =
  | "no_declaration"
  | "awaiting_review"
  | "declaration_changed"
  | "accepted_as_declared"
  | "configured";

export type InstructorDeclarationSummary = {
  declared: boolean;
  note: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
  windows: AvailabilityWindow[];
  /** Null when nothing was declared — no hours stated, not zero hours. */
  hours: number | null;
};

export type InstructorConfigurationSummary = {
  configured: boolean;
  note: string | null;
  configuredBy: string | null;
  updatedAt: string | null;
  windows: AvailabilityWindow[];
  hours: number | null;
};

/**
 * What the decision costs, stated while it is being made.
 * `availableWeeklyHours` and `shortfallHours` are null when nothing is configured.
 */
export type AvailabilityLoad = {
  assignedSubjects: number;
  assignedWeeklyHours: number;
  availableWeeklyHours: number | null;
  shortfallHours: number | null;
};

export type InstructorAvailabilityRow = {
  instructorProfileId: number;
  name: string;
  employeeId: string | null;
  departmentId: number | null;
  departmentAbbrev: string | null;
  employmentStatus: string | null;
  academicRank: string | null;
  reviewState: AvailabilityReviewState;
  reviewStateLabel: string;
  declaration: InstructorDeclarationSummary;
  configuration: InstructorConfigurationSummary;
  load: AvailabilityLoad;
};

export type DepartmentAvailability = {
  syId: number;
  schoolYear: string;
  semesterNumber: number;
  department: { id: number | null; name: string | null; abbrev: string | null };
  /** True when the reader is seeing every department at once — a Registrar. */
  collegeWide: boolean;
  /** state key → the backend's label. */
  reviewStates: Record<string, string>;
  summary: {
    instructors: number;
    declared: number;
    notDeclared: number;
    configured: number;
    awaitingReview: number;
    unconstrained: number;
    withShortfall: number;
  };
  instructors: InstructorAvailabilityRow[];
};

export type AvailabilityConfigurationInput = {
  note: string | null;
  windows: AvailabilityWindow[];
};

export type SavedConfiguration = {
  instructorProfileId: number;
  configured: boolean;
  note: string | null;
  updatedAt: string;
  windows: AvailabilityWindow[];
  hours: number;
  matchesDeclaration: boolean;
  reviewState: AvailabilityReviewState;
};

export type WidenRequestStatus = "pending" | "approved" | "rejected";

export type AvailabilityWidenRequest = {
  id: number;
  instructorProfileId: number;
  instructorName: string | null;
  departmentId: number | null;
  subjectCode: string | null;
  reason: string;
  status: WidenRequestStatus;
  requestedBy: string | null;
  createdAt: string;
  decisionMessage: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  windows: AvailabilityWindow[];
};

export type WidenRequestList = {
  syId: number;
  semesterNumber: number;
  pending: number;
  requests: AvailabilityWidenRequest[];
};

export type WidenRequestInput = {
  reason: string;
  subjectCode: string | null;
  windows: AvailabilityWindow[];
};
