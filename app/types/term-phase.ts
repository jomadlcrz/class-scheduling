import type { ScheduleReleaseStatus } from "~/types/schedule-release";

/** Term-batch scheduling phases. */
export type TermSchedulingPhase =
  | "major_scheduling"
  | "generation"
  | "suggestion_window"
  | "resolution"
  | "finalized";

export type TermPhaseGates = {
  majorsOpen: boolean;
  suggestionsOpen: boolean;
  shiftRequestHasStarted: boolean;
  majorReopenAllowed: boolean;
  perSetReleaseAllowed: boolean;
};

export type TermLifecycleStatus = "major_scheduling" | "distributed" | "resolved" | "finalized";

export type TermDetailStage =
  | "not_started"
  | "major_scheduling"
  | "generation"
  | "initial_review"
  | "ready_for_suggestions"
  | "suggestion_window"
  | "resolution"
  | "final_approval"
  | "ready_for_publication"
  | "finalized";

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
  /** Backend-owned workflow progress; do not infer this from timestamps in the UI. */
  lifecycleStatus: TermLifecycleStatus;
  /** Backend-owned detailed current stage, used to determine the Registrar's next action. */
  detailStage: TermDetailStage;
  storedPhase: TermSchedulingPhase | null;
  governed: boolean;
  majorsDueAt: string | null;
  suggestionsDueAt: string | null;
  /** Successful suggestion submissions allowed per instructor; defaults to 1. */
  suggestionAttemptLimit?: number;
  /** One institution-wide limit used to check every Dean independently. */
  majorEditRequestLimit?: number;
  majorsDeadlinePassed: boolean;
  suggestionsDeadlinePassed: boolean;
  phases: TermPhaseItem[];
  distributedAt: string | null;
  resolvedAt: string | null;
  finalizedAt: string | null;
  updatedAt?: string | null;
  updatedByUserId?: number | null;
  gates: TermPhaseGates;
  suggestionWindowReadiness?: {
    isReady: boolean;
    [key: string]: unknown;
  } | null;
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

export type TermResponseReadiness = {
  allResponded: boolean;
  pendingCount: number;
  expected?: number;
  respondedCount?: number;
  silentCount?: number;
  canCloseEarly?: boolean;
  [key: string]: unknown;
};

