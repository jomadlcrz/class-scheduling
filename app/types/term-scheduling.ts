export type TermSchedulingPhaseValue =
  | "major_scheduling"
  | "generation"
  | "suggestion_window"
  | "resolution"
  | "finalized";

export type TermSchedulingGates = {
  majorsOpen: boolean;
  suggestionsOpen: boolean;
  shiftRequestHasStarted: boolean;
  majorReopenAllowed: boolean;
  perSetReleaseAllowed: boolean;
};

export type TermSchedulingDetailStage =
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

export type TermSuggestionWindowReadiness = {
  requiredDepartmentCount: number;
  finalizedMajorDepartmentCount: number;
  missingMajorDepartments: {
    departmentId: number;
    departmentAbbrev: string;
    departmentName: string;
    submissionStatus: string | null;
  }[];
  totalRequiredReleases: number;
  totalParticipatingReleases: number;
  readyCount: number;
  notReady: {
    setId: number;
    setName: string;
    departmentId: number;
    departmentAbbrev: string;
    releaseStatus: string;
  }[];
  isReady: boolean;
};

export type TermSchedulingCalendar = {
  syId: number;
  semesterNumber: number;
  schoolYear: string | null;
  semesterName: string | null;
  termLabel: string | null;
  phase: TermSchedulingPhaseValue;
  phaseLabel: string;
  storedPhase: TermSchedulingPhaseValue | null;
  detailStage: TermSchedulingDetailStage;
  suggestionWindowReadiness: TermSuggestionWindowReadiness | null;
  governed: boolean;
  majorsDueAt: string | null;
  suggestionsDueAt: string | null;
  suggestionAttemptLimit: number;
  majorEditRequestLimit: number;
  majorsDeadlinePassed: boolean;
  suggestionsDeadlinePassed: boolean;
  phases: TermPhaseRow[];
  distributedAt: string | null;
  resolvedAt: string | null;
  finalizedAt: string | null;
  updatedAt: string | null;
  updatedByUserId: number | null;
  gates: TermSchedulingGates;
  serverTime: string;
  schedulingWindows: SchedulingWindowsSnapshot | null;
};

export type MajorEditRequestAttemptSummary = {
  attemptLimit: number;
  departments: {
    submissionId: number;
    departmentId: number;
    departmentName: string;
    departmentAbbrev: string;
    submissionStatus: string;
    attemptsUsed: number;
    attemptsRemaining: number;
    hasPendingRequest: boolean;
    canRequestEdit: boolean;
  }[];
};

export type TermPhaseRow = {
  phase: TermSchedulingPhaseValue;
  label: string;
  deadlineField: string | null;
  dueAt: string | null;
  deadlinePassed: boolean;
  isCurrent: boolean;
  isOpen: boolean;
  isPast: boolean;
};

export type TermSchedulingSetRef = {
  setId: number;
  setName: string | null;
  programId: number;
  yearLevel: number;
};

export type TermDistributionReadiness = {
  expected: number;
  readyCount: number;
  unscheduled: TermSchedulingSetRef[];
  incomplete: TermSchedulingSetRef[];
  notParticipating: TermSchedulingSetRef[];
  isReady: boolean;
};

export type TermResponseReadiness = {
  expected: number;
  respondedCount: number;
  silentCount: number;
  suggestionCount: number;
  withDeanCount: number;
  withRegistrarCount: number;
  undecidedCount: number;
  everyoneAnswered: boolean;
  canCloseEarly: boolean;
};

export type SchedulingWindowName = "major" | "suggestion";

export type WindowCloseReason = "manual" | "scheduled" | "counterpart_opened";

export type SchedulingWindowState = {
  window: SchedulingWindowName;
  label: string;
  status: "open" | "closed";
  isOpen: boolean;
  openedAt: string | null;
  scheduledClosingAt: string | null;
  closedAt: string | null;
  closeReason: WindowCloseReason | null;
  openedByUserId: number | null;
  closedByUserId: number | null;
};

export type SchedulingWindowsSnapshot = {
  syId: number;
  semesterNumber: number;
  openWindow: SchedulingWindowName | null;
  windows: Record<SchedulingWindowName, SchedulingWindowState>;
  serverTime: string;
  history?: SchedulingWindowPeriod[];
};

export type SchedulingWindowPeriod = {
  id: number;
  window: SchedulingWindowName;
  label: string;
  openedAt: string;
  openedByUserId: number | null;
  scheduledClosingAt: string;
  closedAt: string | null;
  closedByUserId: number | null;
  closeReason: WindowCloseReason | null;
};

export type TermDepartmentBlockReason =
  | "no_finalized_majors"
  | "no_sets"
  | "schedules_incomplete"
  | "nothing_to_send"
  | "majors_still_open";

export type TermDepartmentSet = {
  setId: number;
  setName: string | null;
  setCode: string | null;
  yearLevel: number | null;
  sessionCount: number;
  status: "ready" | "incomplete" | "unscheduled";
  releaseId: number | null;
  releaseStatus: string | null;
};

export type TermDepartmentProgram = {
  programId: number;
  programAbbrev: string | null;
  programName: string | null;
  sets: TermDepartmentSet[];
  publishedAt: string | null;
};

export type TermDepartmentEntry = {
  departmentId: number;
  departmentAbbrev: string | null;
  departmentName: string | null;
  isParticipating: boolean;
  totalSets: number;
  readyCount: number;
  sendableCount: number;
  canSend: boolean;
  blockedReason: TermDepartmentBlockReason | null;
  programs: TermDepartmentProgram[];
};

export type TermDepartmentReadiness = {
  departments: TermDepartmentEntry[];
};

export type TermProgramSendResult = {
  message: string;
  term: TermSchedulingCalendar;
  programId: number;
  programAbbrev: string | null;
  departmentId: number;
  sentSetIds: number[];
  termDistributed: boolean;
};

export type TermProgramPublishResult = {
  message: string;
  programAbbrev: string | null;
  published: number;
  alreadyPublished: number;
  setIds: number[];
  termFinalized: boolean;
};

export type TermProgramWithdrawResult = {
  message: string;
  term: TermSchedulingCalendar;
  programId: number;
  programAbbrev: string | null;
  departmentId: number;
  withdrawnSetIds: number[];
};

export type TermDepartmentSendResult = {
  message: string;
  term: TermSchedulingCalendar;
  departmentId: number;
  departmentAbbrev: string | null;
  sentSetIds: number[];
  termDistributed: boolean;
};

export type TermMajorLockReport = {
  finalized: number[];
  blocked: {
    departmentId: number;
    submissionId: number;
    status: string;
    reason: string;
  }[];
};

export type TermDeadlineChange = {
  field: "majors_due_at" | "suggestions_due_at";
  label: string;
  previous: string | null;
  next: string | null;
};

export type TermDeadlineEffect = {
  type: "phase_closed" | "phase_reopened";
  phase: TermSchedulingPhaseValue;
  field: string;
  releasesReset?: number;
  setsCleared?: number;
  setsKept?: { setId: number; reason: string }[];
  appliedResultsRetained?: boolean;
};

export type TermDeadlineUpdate = {
  message: string;
  term: TermSchedulingCalendar;
  changes: TermDeadlineChange[];
  effects: TermDeadlineEffect[];
  warnings: string[];
};

export type TermAdvanceAction =
  | "close_majors"
  | "distribute"
  | "resolve"
  | "forward_for_approval"
  | "finalize";

export type TermAdvanceResult = {
  message: string;
  term: TermSchedulingCalendar;
  distributedSetIds?: number[];
  majors?: TermMajorLockReport;
};
