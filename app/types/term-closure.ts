export type TermClosureUser = {
  userId: number;
  fullName: string;
  position: string | null;
  display: string;
};

export type TermClosureHistoryEntry = {
  closedAtDisplay: string | null;
  headline: string;
  closedBy: TermClosureUser | null;
  closedReasonLabel: string | null;
  notes: string | null;
};

export type TermClosureTermInformation = {
  schoolYear: string;
  semester: string;
  semesterNumber: number;
  status: "Open" | "Closed";
  closedReason: string | null;
  closedReasonLabel: string | null;
  closedBy: TermClosureUser | null;
  closedAtDisplay: string | null;
  notes: string | null;
};

export type TermClosureItem = {
  id: number | null;
  syId: number;
  semId: number;
  schoolYear: string;
  semesterNumber: number;
  semesterDisplayName: string;
  status: "Open" | "Closed";
  closedReason: string | null;
  closedReasonLabel: string | null;
  closedAtDisplay: string | null;
  closedBy: TermClosureUser | null;
  notes: string | null;
  reopenable: boolean;
  termInformation: TermClosureTermInformation;
  closureEffects: { label: string }[];
  closureHistory: TermClosureHistoryEntry[];
  actions: {
    viewDetails: boolean;
    canClose: boolean;
    canReopen: boolean;
  };
};

export type TermAuditLogEntry = {
  id: number;
  occurredAtDisplay: string | null;
  action: string;
  actionLabel: string;
  termDisplay: string | null;
  performedByDisplay: string | null;
  role: string | null;
  ipAddress: string | null;
  details: string | null;
};

export type TermAuditLogFilters = {
  schoolYears: { id: number; schoolYear: string }[];
  semesters: { id: number; semesterNumber: number; displayName: string }[];
  actions: { value: string; label: string }[];
  performers: { userId: number; display: string }[];
};

export type TermAuditLogResult = {
  items: TermAuditLogEntry[];
  page: number;
  perPage: number;
  total: number;
  pages: number;
};
