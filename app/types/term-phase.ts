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
  suggestion_window: "Shift Request",
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
  /** Whether this phase is currently accepting work; distinct from isCurrent. */
  isOpen?: boolean;
  isPast: boolean;
};

export type SchedulingWindowName = "major" | "suggestion";

export type SchedulingWindow = {
  window: SchedulingWindowName;
  label: string;
  status?: string;
  isOpen: boolean;
  openedAt: string | null;
  scheduledClosingAt: string | null;
  closedAt: string | null;
  closeReason: "manual" | "scheduled" | "counterpart_opened" | null;
  openedByUserId?: number | null;
  closedByUserId?: number | null;
};

export type SchedulingWindowsSnapshot = {
  syId: number;
  semesterNumber: number;
  openWindow: SchedulingWindowName | null;
  windows: Record<SchedulingWindowName, SchedulingWindow>;
  serverTime: string;
  history?: SchedulingWindow[];
};

export type TermPhaseResponse = {
  syId: number | null;
  semesterNumber: number | null;
  schoolYear: string | null;
  semesterName: string | null;
  termLabel: string | null;
  phase: TermSchedulingPhase;
  phaseLabel: string;
  storedPhase: TermSchedulingPhase | null;
  governed: boolean;
  majorsDueAt: string | null;
  suggestionsDueAt: string | null;
  majorsDeadlinePassed: boolean;
  suggestionsDeadlinePassed: boolean;
  phases: TermPhaseItem[];
  distributedAt: string | null;
  resolvedAt: string | null;
  finalizedAt: string | null;
  updatedAt?: string | null;
  updatedByUserId?: number | null;
  gates: TermPhaseGates;
  schedulingWindows?: SchedulingWindowsSnapshot;
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

export type MajorSchedulingExtension = {
  id: number;
  departmentId: number;
  extendedUntil: string;
  reason: string | null;
  grantedAt: string;
  grantedByUserId: number | null;
  revokedAt: string | null;
  revokedByUserId: number | null;
  active: boolean;
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
  suggestionsDueAt?: string | null;
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
