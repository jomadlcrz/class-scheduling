export type ScheduleAgentWorkspace = "registrar" | "dean";

/**
 * What a Marvis conversation is anchored to for persistence/threading.
 * "submission" is the normal case (a specific department's build). "term"
 * is Registrar-only, for when no department has submitted anything for the
 * selected term yet -- Marvis is still institution-wide and usable (see
 * get_term_schedule on the backend), it just has no submission to file a
 * new CREATE proposal against.
 */
export type ScheduleAgentTarget =
  | { kind: "submission"; submissionId: number }
  | { kind: "term"; syId: number; semesterNumber: number };

export type ScheduleAgentModel = {
  key: string;
  label: string;
};

export type ScheduleAgentModelCatalog = {
  models: ScheduleAgentModel[];
  defaultSolverModel: string;
  defaultReviewerModel: string;
};

export type ScheduleAgentSubmissionOption = {
  id: number;
  departmentId: number;
  departmentName: string;
  departmentAbbrev: string;
  status: string;
  syId: number;
  semesterNumber: number;
};

export type ScheduleAgentProgramProgress = {
  phase: "target-start" | "target-done";
  target: string;
  index: number;
  total: number;
};

export type ScheduleAgentProgramGenerationRequest = {
  key: string;
  programId: number;
  programLabel: string;
};

export type ScheduleAgentProposedMeeting = {
  meeting_type?: string;
  day?: string;
  start_time?: string;
  end_time?: string;
  start_time_12h?: string;
  end_time_12h?: string;
  room_id?: number;
  room_name?: string;
  conflict_check?: {
    conflicts: boolean;
    detail: string | null;
  };
};

export type ScheduleAgentProposedChange = {
  schedule_id?: number;
  action?: string;
  current?: Record<string, unknown>;
  proposed?: Record<string, unknown>;
  reason?: string;
  validation_status?: string;
  // CREATE-shaped proposals (a brand new meeting, not a move) use this
  // shape instead of schedule_id/current/proposed.
  subject_id?: number;
  subject_code?: string;
  set_id?: number;
  set_name?: string;
  instructor_id?: number | null;
  instructor_name?: string;
  meetings?: ScheduleAgentProposedMeeting[];
};

export type ScheduleAgentApplyResultItem = {
  action?: "CREATE" | "MOVE" | "CHANGE_ROOM" | "DELETE";
  // The existing meeting a MOVE/CHANGE_ROOM/DELETE item acted on — null for
  // CREATE, which has no existing meeting to reference.
  targetScheduleId?: number | null;
  setId?: number;
  subjectId?: number;
  day?: string;
  startTime?: string;
  endTime?: string;
  startTime12h?: string;
  endTime12h?: string;
  success: boolean;
  // The row now representing this meeting in the real timetable: the new
  // meeting's id for CREATE, the moved/recreated meeting's id for MOVE/
  // CHANGE_ROOM, null for a successful DELETE (nothing exists at that id
  // anymore) or any failure.
  scheduleId: number | null;
  error: string | null;
};

export type ScheduleAgentApplyResult = {
  results: ScheduleAgentApplyResultItem[];
  appliedCount: number;
  failedCount: number;
};

/**
 * The Solver Agent's raw parsed JSON. Backend-truth: every field here is
 * whatever the LLM returned, surfaced verbatim — never reworded on the
 * frontend. `out_of_scope`/`parse_error` are alternate shapes the same
 * response can take instead of a normal proposal; render whichever is present.
 */
export type ScheduleAgentSolution = {
  out_of_scope?: boolean;
  reason?: string;
  parse_error?: string;
  raw?: string | null;
  conflict_type?: string;
  summary?: string;
  affected_schedule_ids?: number[];
  proposals?: ScheduleAgentProposedChange[];
  missing_information?: string[];
};

/** The Reviewer Agent's raw parsed JSON — same verbatim/alternate-shape rules as above. */
export type ScheduleAgentReview = {
  parse_error?: string;
  raw?: string | null;
  risk_level?: string;
  issues?: string[];
  questions_for_dean?: string[];
  recommendation?: string;
};

export type ScheduleAgentResult = {
  proposalId: number;
  conversationId: string;
  solution: ScheduleAgentSolution;
  review: ScheduleAgentReview | null;
  status: string;
};

/** One turn of a conversation, as returned when loading its messages. */
export type ScheduleAgentHistoryItem = {
  proposalId: number;
  message: string;
  solution: ScheduleAgentSolution;
  review: ScheduleAgentReview | null;
  status: string;
  createdAt: string;
};

/** One resumable thread, as listed by the history picker. */
export type ScheduleAgentConversationSummary = {
  conversationId: string;
  title: string;
  messageCount: number;
  startedAt: string;
  lastActivityAt: string;
};
