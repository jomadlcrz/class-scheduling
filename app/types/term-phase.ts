import type { ScheduleReleaseStatus } from "~/types/schedule-release";

/** Term-batch scheduling phases. */
export type TermSchedulingPhase =
  | "major_scheduling"
  | "generation"
  | "suggestion_window"
  | "resolution"
  | "finalized";

export const TERM_SCHEDULING_PHASE_LABELS: Record<TermSchedulingPhase, string> = {
  major_scheduling: "Major Scheduling",
  generation: "Generation",
  suggestion_window: "Suggestion Window",
  resolution: "Resolution",
  finalized: "Finalized",
};

export const TERM_SCHEDULING_PHASE_ORDER: TermSchedulingPhase[] = [
  "major_scheduling",
  "generation",
  "suggestion_window",
  "resolution",
  "finalized",
];

export type TermPhaseGates = {
  majorsOpen: boolean;
  suggestionsOpen: boolean;
  perSetReleaseAllowed: boolean;
};

export type TermPhaseItem = {
  phase: TermSchedulingPhase;
  label: string;
  deadlineField: string | null;
  dueAt: string | null;
  deadlinePassed: boolean;
  isCurrent: boolean;
  isPast: boolean;
};

export type TermPhaseResponse = {
  syId: number;
  semesterNumber: number;
  phase: TermSchedulingPhase;
  phaseLabel: string;
  storedPhase: TermSchedulingPhase;
  governed: boolean;
  majorsDueAt: string | null;
  generationDueAt?: string | null;
  suggestionsDueAt: string | null;
  resolutionDueAt?: string | null;
  majorsDeadlinePassed: boolean;
  suggestionsDeadlinePassed: boolean;
  phases?: TermPhaseItem[];
  distributedAt: string | null;
  resolvedAt: string | null;
  finalizedAt: string | null;
  updatedAt?: string | null;
  updatedByUserId?: number | null;
  gates: TermPhaseGates;
  serverTime: string;
};

export type ReadinessSetItem = {
  setId: number;
  setName: string;
  programId: number;
  yearLevel: number;
};

export type TermDistributionReadiness = {
  expected: number;
  readyCount: number;
  unscheduled: ReadinessSetItem[];
  incomplete: ReadinessSetItem[];
  notParticipating: ReadinessSetItem[];
  isReady: boolean;
};

export type DepartmentSetReadiness = {
  setId: number;
  setName: string;
  setCode: string;
  yearLevel: number;
  sessionCount: number;
  status: "unscheduled" | "incomplete" | "ready";
  releaseId: number | null;
  releaseStatus: ScheduleReleaseStatus | null;
};

export type DepartmentProgramReadiness = {
  programId: number;
  programAbbrev: string;
  programName: string;
  sets: DepartmentSetReadiness[];
};

export type DepartmentReadinessItem = {
  departmentId: number;
  departmentAbbrev: string;
  departmentName: string;
  isParticipating: boolean;
  totalSets: number;
  readyCount: number;
  sendableCount: number;
  canSend: boolean;
  blockedReason: string | null;
  programs: DepartmentProgramReadiness[];
};

export type DepartmentReadinessResponse = {
  departments: DepartmentReadinessItem[];
};

export type TermResolutionOutcomeType = "satisfied" | "rejected" | "blocked_by_major";

export type TermResolutionOutcomeItem = {
  responseId: number;
  subjectCode: string | null;
  setName: string | null;
  outcome: TermResolutionOutcomeType;
  reason: string | null;
  moves: number;
  creates: number;
  drops: number;
};

export type TermResolutionStats = {
  suggestionsTotal: number;
  satisfied: number;
  rejected: number;
  blockedByMajor: number;
  solverStatus?: string;
  seconds?: number;
};

export type TermResolutionRun = {
  id: number;
  syId: number;
  semesterNumber: number;
  status: "pending" | "running" | "ready" | "failed";
  committed: boolean;
  stats?: TermResolutionStats;
  error?: string | null;
  createdAt?: string | null;
  solvedAt?: string | null;
  outcome?: TermResolutionOutcomeItem[];
};

export type DeadlinesUpdatePayload = {
  majorsDueAt?: string | null;
  generationDueAt?: string | null;
  suggestionsDueAt?: string | null;
  resolutionDueAt?: string | null;
  discardGenerated?: boolean;
};

export type DeadlineChange = {
  key: string;
  label: string;
  previous: string | null;
  next: string | null;
};

export type DeadlineEffect = {
  type: string;
  phase?: string;
  releasesReset?: number;
  setsCleared?: number;
  setsKept?: number;
  [key: string]: unknown;
};

export type DeadlinesUpdateResult = {
  term: TermPhaseResponse;
  changes: DeadlineChange[];
  effects: DeadlineEffect[];
  warnings: string[];
};

export type TermAdvanceAction =
  | "close_majors"
  | "distribute"
  | "resolve"
  | "forward_for_approval"
  | "finalize";

export type TermPhaseStepResult = {
  message: string;
  term: TermPhaseResponse;
  undone: string[];
};

export type PhaseWindowItem = {
  phase: TermSchedulingPhase;
  label: string;
  opensAt: string | null;
  closesAt: string | null;
  canClose: boolean;
};

export type TermPhaseWindowsResponse = {
  syId: number;
  semesterNumber: number;
  phases: PhaseWindowItem[];
  warnings: string[];
};

export type SetPhaseWindowPayload = {
  opensAt?: string | null;
  closesAt?: string | null;
};

export type SetPhaseWindowResult = TermPhaseWindowsResponse & {
  changes: { field: string; previous: string | null; next: string | null }[];
  message: string;
};
