import { apiGet, apiMessage, apiPatch } from "~/lib/api";
import type {
  SchoolYearClosePreview,
  TermAuditLogEntry,
  TermAuditLogFilters,
  TermAuditLogResult,
  TermClosePreview,
  TermClosureHistoryEntry,
  TermClosureItem,
  TermClosureListResult,
  TermClosureTermInformation,
  TermClosureUser,
  TermWorkflow,
  TermWorkflowNextAction,
  TermWorkflowStep,
} from "~/types/term-closure";

type ApiUser = {
  user_id: number;
  full_name: string;
  position: string | null;
  display: string;
};

type ApiHistoryEntry = {
  closed_at_display: string | null;
  headline: string;
  closed_by: ApiUser | null;
  closed_reason_label: string | null;
  notes: string | null;
};

type ApiTermInformation = {
  school_year: string;
  semester?: string;
  semester_name?: string;
  semester_number: number;
  status: "Open" | "Closed";
  closed_reason: string | null;
  closed_reason_label: string | null;
  closed_by: ApiUser | null;
  closed_at_display: string | null;
  notes: string | null;
};

type ApiTermClosureItem = {
  id: number | null;
  sy_id: number;
  school_year: string;
  semester_number: number;
  semester_name?: string;
  semester_display_name?: string;
  status: "Open" | "Closed";
  closed_reason: string | null;
  closed_reason_label: string | null;
  closed_at_display: string | null;
  closed_by: ApiUser | null;
  notes: string | null;
  reopenable: boolean;
  term_information: ApiTermInformation;
  closure_effects: { label: string }[];
  closure_history: ApiHistoryEntry[];
  actions: {
    view_details: boolean;
    can_close: boolean;
    can_reopen: boolean;
  };
};

function resolveSemesterName(
  raw: { semester_name?: string; semester_display_name?: string; semester?: string; semester_number?: number },
): string {
  return (
    raw.semester_display_name ??
    raw.semester_name ??
    raw.semester ??
    (raw.semester_number != null ? `Semester ${raw.semester_number}` : "—")
  );
}

type ApiAuditEntry = {
  id: number;
  occurred_at_display: string | null;
  action: string;
  action_label: string;
  term: { display: string | null } | null;
  performed_by: ApiUser | null;
  role: string | null;
  ip_address: string | null;
  details: string | null;
};

type ApiLifecycleActions = {
  can_close: boolean;
  can_open?: boolean;
  can_reopen: boolean;
};

type ApiSchoolYearState = {
  sy_id: number;
  school_year: string;
  status: "Open" | "Closed";
  is_closed: boolean;
  reopenable: boolean;
  actions: ApiLifecycleActions;
  closed_reason: string | null;
  closure_reason: string | null;
  closed_at: string | null;
  closed_at_display: string | null;
  closed_by: ApiUser | null;
  posted_semesters: number[];
  both_semesters_posted: boolean;
  lock_effects: string[];
};

type ApiTermState = ApiTermClosureItem & {
  is_closed: boolean;
  parent_school_year: { sy_id: number; school_year: string; status: "Open" | "Closed" };
  lock_effects: string[];
};

export type LifecycleActions = { canClose: boolean; canOpen: boolean; canReopen: boolean };

export type SchoolYearLifecycleState = {
  syId: number;
  schoolYear: string;
  status: "Open" | "Closed";
  isClosed: boolean;
  reopenable: boolean;
  actions: LifecycleActions;
  closedReason: string | null;
  closureReason: string | null;
  closedAt: string | null;
  closedAtDisplay: string | null;
  closedBy: TermClosureUser | null;
  postedSemesters: number[];
  bothSemestersPosted: boolean;
  lockEffects: string[];
};

export type TermLifecycleState = {
  closure: TermClosureItem;
  isClosed: boolean;
  parentSchoolYear: { syId: number; schoolYear: string; status: "Open" | "Closed" };
  lockEffects: string[];
};

export type AcademicLifecycle = {
  schoolYear: SchoolYearLifecycleState;
  terms: {
    semesterNumber: number;
    term: TermLifecycleState;
  }[];
  workflow: TermWorkflow["workflow"];
};

type ApiWorkflowPayload = {
  steps: {
    key: string;
    label: string;
    description: string;
    status: "completed" | "current" | "pending";
    semester_number?: number;
  }[];
  active_semester_number: number | null;
  posted_semesters: number[];
  both_semesters_posted: boolean;
  school_year_completed: boolean;
  next_action: {
    key: string;
    label: string;
    description: string;
    semester_number?: number;
    method?: string;
    preview_path?: string;
    submit_path?: string;
    body?: { status: "open" | "closed"; reason?: string };
  };
};

function mapUser(raw: ApiUser | null | undefined): TermClosureUser | null {
  if (!raw) return null;
  return {
    userId: raw.user_id,
    fullName: raw.full_name,
    position: raw.position,
    display: raw.display,
  };
}

function mapTermInformation(raw: ApiTermInformation): TermClosureTermInformation {
  return {
    schoolYear: raw.school_year,
    semester: resolveSemesterName(raw),
    semesterNumber: raw.semester_number,
    status: raw.status,
    closedReason: raw.closed_reason,
    closedReasonLabel: raw.closed_reason_label,
    closedBy: mapUser(raw.closed_by),
    closedAtDisplay: raw.closed_at_display,
    notes: raw.notes,
  };
}

function mapHistoryEntry(raw: ApiHistoryEntry): TermClosureHistoryEntry {
  return {
    closedAtDisplay: raw.closed_at_display,
    headline: raw.headline,
    closedBy: mapUser(raw.closed_by),
    closedReasonLabel: raw.closed_reason_label,
    notes: raw.notes,
  };
}

function mapClosureItem(raw: ApiTermClosureItem): TermClosureItem {
  return {
    id: raw.id,
    syId: raw.sy_id,
    schoolYear: raw.school_year,
    semesterNumber: raw.semester_number,
    semesterDisplayName: resolveSemesterName(raw),
    status: raw.status,
    closedReason: raw.closed_reason,
    closedReasonLabel: raw.closed_reason_label,
    closedAtDisplay: raw.closed_at_display,
    closedBy: mapUser(raw.closed_by),
    notes: raw.notes,
    reopenable: raw.reopenable,
    termInformation: mapTermInformation(raw.term_information),
    closureEffects: raw.closure_effects,
    closureHistory: raw.closure_history.map(mapHistoryEntry),
    actions: {
      viewDetails: raw.actions.view_details,
      canClose: raw.actions.can_close,
      canReopen: raw.actions.can_reopen,
    },
  };
}

function mapAuditEntry(raw: ApiAuditEntry): TermAuditLogEntry {
  return {
    id: raw.id,
    occurredAtDisplay: raw.occurred_at_display,
    action: raw.action,
    actionLabel: raw.action_label,
    termDisplay: raw.term?.display ?? null,
    performedByDisplay: raw.performed_by?.display ?? null,
    role: raw.role,
    ipAddress: raw.ip_address,
    details: raw.details,
  };
}

function mapLifecycleActions(raw: ApiLifecycleActions): LifecycleActions {
  return { canClose: raw.can_close, canOpen: raw.can_open ?? raw.can_reopen, canReopen: raw.can_reopen };
}

function mapSchoolYearState(raw: ApiSchoolYearState): SchoolYearLifecycleState {
  return {
    syId: raw.sy_id,
    schoolYear: raw.school_year,
    status: raw.status,
    isClosed: raw.is_closed,
    reopenable: raw.reopenable,
    actions: mapLifecycleActions(raw.actions),
    closedReason: raw.closed_reason,
    closureReason: raw.closure_reason,
    closedAt: raw.closed_at,
    closedAtDisplay: raw.closed_at_display,
    closedBy: mapUser(raw.closed_by),
    postedSemesters: raw.posted_semesters,
    bothSemestersPosted: raw.both_semesters_posted,
    lockEffects: raw.lock_effects,
  };
}

function mapTermState(raw: ApiTermState): TermLifecycleState {
  return {
    closure: mapClosureItem(raw),
    isClosed: raw.is_closed,
    parentSchoolYear: {
      syId: raw.parent_school_year.sy_id,
      schoolYear: raw.parent_school_year.school_year,
      status: raw.parent_school_year.status,
    },
    lockEffects: raw.lock_effects,
  };
}

function mapWorkflow(raw: ApiWorkflowPayload): TermWorkflow["workflow"] {
  return {
    steps: raw.steps.map(
      (step): TermWorkflowStep => ({
        key: step.key,
        label: step.label,
        description: step.description,
        status: raw.school_year_completed ? "completed" : step.status,
        semesterNumber: step.semester_number,
      }),
    ),
    activeSemesterNumber: raw.active_semester_number,
    postedSemesters: raw.posted_semesters,
    bothSemestersPosted: raw.both_semesters_posted,
    schoolYearCompleted: raw.school_year_completed,
    nextAction: mapNextAction(raw.next_action),
  };
}

function mapNextAction(raw: ApiWorkflowPayload["next_action"]): TermWorkflowNextAction {
  return {
    key: raw.key,
    label: raw.label,
    description: raw.description,
    semesterNumber: raw.semester_number,
    method: raw.method,
    previewPath: raw.preview_path,
    submitPath: raw.submit_path,
    body: raw.body,
  };
}

function lifecycleToTermWorkflow(lifecycle: AcademicLifecycle): TermWorkflow {
  return {
    schoolYear: {
      id: lifecycle.schoolYear.syId,
      schoolYear: lifecycle.schoolYear.schoolYear,
      registrarCompleted: lifecycle.schoolYear.isClosed,
      reopenable: lifecycle.schoolYear.reopenable,
    },
    semesters: lifecycle.terms.map((row) => ({
      semesterNumber: row.semesterNumber,
      semesterName: row.term.closure.semesterDisplayName,
      status: row.term.closure.status,
      closedReason: row.term.closure.closedReason,
      closedReasonLabel: row.term.closure.closedReasonLabel,
      actions: {
        canClose: row.term.closure.actions.canClose,
        canReopen: row.term.closure.actions.canReopen,
      },
    })),
    workflow: lifecycle.workflow,
  };
}

function lockEffectsToClosureEffects(effects: string[]): { label: string }[] {
  return effects.map((label) => ({ label }));
}

export type TermContext = {
  schoolYears: { id: number; schoolYear: string }[];
  semesters: { semesterNumber: number; label: string }[];
  selection: { syId: number | null; semesterNumber: number | null; schoolYear: string | null };
  term: TermClosureItem | null;
  calendar: { academicYearStartMonth: number; currentSchoolYear: string | null; currentSemesterNumber: number | null; existsForToday: boolean | null; expectedSchoolYear: string | null };
};

/** GET /terms/context — bootstrap payload for term selectors and closure screens. */
async function getContext(params: { syId?: number; semesterNumber?: number } = {}): Promise<TermContext> {
  const query = new URLSearchParams();
  if (params.syId != null) query.set("sy_id", String(params.syId));
  if (params.semesterNumber != null) query.set("semester_number", String(params.semesterNumber));
  const raw = await apiGet<{
    school_years: { id: number; school_year: string }[];
    semesters: { id?: number; semester_number: number; semester_name?: string; display_name?: string }[];
    selection: { sy_id: number | null; semester_number: number | null; school_year: string | null };
    term: ApiTermClosureItem | null;
    calendar: { academic_year_start_month: number; current_school_year: string | null; current_semester_number: number | null; exists_for_today: boolean | null; expected_school_year: string | null };
  }>(`/terms/context${query.size ? `?${query}` : ""}`);
  return {
    schoolYears: raw.school_years.map((row) => ({ id: row.id, schoolYear: row.school_year })),
    semesters: raw.semesters.map((row) => ({
      semesterNumber: row.semester_number,
      label: resolveSemesterName(row),
    })),
    selection: { syId: raw.selection.sy_id, semesterNumber: raw.selection.semester_number, schoolYear: raw.selection.school_year },
    term: raw.term ? mapClosureItem(raw.term) : null,
    calendar: { academicYearStartMonth: raw.calendar.academic_year_start_month, currentSchoolYear: raw.calendar.current_school_year, currentSemesterNumber: raw.calendar.current_semester_number, existsForToday: raw.calendar.exists_for_today, expectedSchoolYear: raw.calendar.expected_school_year },
  };
}

/** GET /school-years/:id/terms/:semester/state — lifecycle status for one term. */
async function getStatus(syId: number, semesterNumber: number): Promise<TermClosureItem> {
  const raw = await apiGet<ApiTermState>(
    `/school-years/${syId}/terms/${semesterNumber}/state`,
  );
  return mapClosureItem(raw);
}

/** GET /school-years/:id/terms/:semester/state/preview — impact summary before posting a term. */
async function getClosePreview(syId: number, semesterNumber: number): Promise<TermClosePreview> {
  return getTermStatePreview(syId, semesterNumber);
}

/** PATCH /school-years/:id/terms/:semester/state — post (close) a term. */
async function close(syId: number, semesterNumber: number, reason?: string): Promise<string> {
  return patchTermState(syId, semesterNumber, "closed", reason);
}

/** GET /terms/closures — registrar-posted closures, newest first. */
async function listClosures(): Promise<TermClosureListResult> {
  const data = await apiGet<{
    items: ApiTermClosureItem[];
    closure_effects: { label: string }[];
  }>("/terms/closures");
  return {
    items: data.items.map(mapClosureItem),
    closureEffects: data.closure_effects ?? [],
  };
}

/** GET /terms/closures/:id — detail for one registrar-posted closure. */
async function getClosure(closureId: number): Promise<TermClosureItem> {
  return mapClosureItem(await apiGet<ApiTermClosureItem>(`/terms/closures/${closureId}`));
}

/** PATCH /school-years/:id/terms/:semester/state — reopen a posted term. */
async function reopen(syId: number, semesterNumber: number, reason?: string): Promise<string> {
  return patchTermState(syId, semesterNumber, "open", reason);
}

/** GET /terms/audit-log/filters */
async function auditLogFilters(): Promise<TermAuditLogFilters> {
  const data = await apiGet<{
    school_years: { id: number; school_year: string }[];
    semesters: { id?: number; semester_number: number; semester_name?: string; display_name?: string }[];
    actions: { value: string; label: string }[];
    performed_by: { user_id: number; display: string }[];
  }>("/terms/audit-log/filters");

  return {
    schoolYears: data.school_years.map((row) => ({ id: row.id, schoolYear: row.school_year })),
    semesters: data.semesters.map((row) => ({
      id: row.id ?? row.semester_number,
      semesterNumber: row.semester_number,
      displayName: resolveSemesterName(row),
    })),
    actions: data.actions,
    performers: data.performed_by.map((row) => ({
      userId: row.user_id,
      display: row.display,
    })),
  };
};

type AuditLogQuery = {
  syId?: number;
  semesterNumber?: number;
  action?: string;
  performedBy?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
};

/** GET /terms/audit-log */
async function listAuditLog(query: AuditLogQuery = {}): Promise<TermAuditLogResult> {
  const params = new URLSearchParams();
  if (query.syId != null) params.set("sy_id", String(query.syId));
  if (query.semesterNumber != null) params.set("semester_number", String(query.semesterNumber));
  if (query.action) params.set("action", query.action);
  if (query.performedBy != null) params.set("performed_by", String(query.performedBy));
  if (query.dateFrom) params.set("date_from", query.dateFrom);
  if (query.dateTo) params.set("date_to", query.dateTo);
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));

  const qs = params.toString();
  const data = await apiGet<{
    items: ApiAuditEntry[];
    pagination: { page: number; per_page: number; total: number; pages: number };
  }>(`/terms/audit-log${qs ? `?${qs}` : ""}`);

  return {
    items: data.items.map(mapAuditEntry),
    page: data.pagination.page,
    perPage: data.pagination.per_page,
    total: data.pagination.total,
    pages: data.pagination.pages,
  };
}

/** GET /school-years/{id}/lifecycle — preferred workflow source for term closure UI. */
async function getLifecycle(syId: number): Promise<AcademicLifecycle> {
  const raw = await apiGet<{
    school_year: ApiSchoolYearState;
    terms: { semester_number: number; term: ApiTermState }[];
    workflow: ApiWorkflowPayload;
  }>(`/school-years/${syId}/lifecycle`);
  return {
    schoolYear: mapSchoolYearState(raw.school_year),
    terms: raw.terms.map((row) => ({
      semesterNumber: row.semester_number,
      term: mapTermState(row.term),
    })),
    workflow: mapWorkflow(raw.workflow),
  };
}

/** Workflow view derived from GET /school-years/{id}/lifecycle. */
async function getTermWorkflow(syId: number): Promise<TermWorkflow> {
  return lifecycleToTermWorkflow(await getLifecycle(syId));
}

/** GET /school-years/{id}/state/preview — preview closing a school year. */
async function getSchoolYearClosePreview(syId: number): Promise<SchoolYearClosePreview> {
  return getSchoolYearStatePreview(syId);
}

/** PATCH /school-years/{id}/state — close a school year after both semesters are posted. */
async function closeSchoolYear(syId: number, reason?: string): Promise<string> {
  return patchSchoolYearState(syId, "closed", reason);
}

/** PATCH /school-years/{id}/state — reopen a registrar-closed school year. */
async function reopenSchoolYear(syId: number, reason?: string): Promise<string> {
  return patchSchoolYearState(syId, "open", reason);
}

/** GET /school-years/:id/state. */
async function getSchoolYearState(syId: number): Promise<SchoolYearLifecycleState> {
  return mapSchoolYearState(await apiGet<ApiSchoolYearState>(`/school-years/${syId}/state`));
}

/** GET /school-years/:id/state/preview. */
async function getSchoolYearStatePreview(syId: number): Promise<SchoolYearClosePreview> {
  const raw = await apiGet<{
    school_year: { id: number; school_year: string };
    posted_semesters: number[];
    missing_semesters: number[];
    already_completed: boolean;
    can_close: boolean;
    lock_effects: string[];
    confirmation: {
      title: string;
      message: string;
      completion_reason_label: string;
      completion_reason_required: boolean;
    };
  }>(`/school-years/${syId}/state/preview`);
  return {
    schoolYear: { id: raw.school_year.id, schoolYear: raw.school_year.school_year },
    postedSemesters: raw.posted_semesters,
    missingSemesters: raw.missing_semesters,
    alreadyCompleted: raw.already_completed,
    canClose: raw.can_close,
    lockEffects: raw.lock_effects ?? [],
    confirmation: {
      title: raw.confirmation.title,
      message: raw.confirmation.message,
      completionReasonLabel: raw.confirmation.completion_reason_label,
      completionReasonRequired: raw.confirmation.completion_reason_required,
    },
  };
}

/** PATCH /school-years/:id/state. */
async function patchSchoolYearState(syId: number, status: "open" | "closed", reason?: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/school-years/${syId}/state`, {
    status,
    ...(reason ? { reason } : {}),
  });
  return apiMessage(data);
}

/** GET /school-years/:id/terms/:semester/state. */
async function getTermState(syId: number, semesterNumber: number): Promise<TermLifecycleState> {
  const raw = await apiGet<ApiTermState>(`/school-years/${syId}/terms/${semesterNumber}/state`);
  return mapTermState(raw);
}

/** GET /school-years/:id/terms/:semester/state/preview. */
async function getTermStatePreview(syId: number, semesterNumber: number): Promise<TermClosePreview> {
  const raw = await apiGet<{
    term: {
      sy_id: number;
      school_year: string;
      semester_number: number;
      semester_name: string;
      status: "Open" | "Closed";
      closed_reason: string | null;
      closed_reason_label: string | null;
    };
    can_close: boolean;
    already_closed: boolean;
    closure_effects: { label: string }[];
    lock_effects: string[];
    confirmation: {
      title: string;
      message: string;
      closure_reason_label: string;
      closure_reason_required: boolean;
    };
  }>(`/school-years/${syId}/terms/${semesterNumber}/state/preview`);
  const lockEffects = raw.lock_effects ?? [];
  const closureEffects =
    raw.closure_effects.length > 0 ? raw.closure_effects : lockEffectsToClosureEffects(lockEffects);
  return {
    term: {
      syId: raw.term.sy_id,
      schoolYear: raw.term.school_year,
      semesterNumber: raw.term.semester_number,
      semesterName: raw.term.semester_name,
      status: raw.term.status,
      closedReason: raw.term.closed_reason,
      closedReasonLabel: raw.term.closed_reason_label,
    },
    canClose: raw.can_close,
    alreadyClosed: raw.already_closed,
    closureEffects,
    lockEffects,
    confirmation: {
      title: raw.confirmation.title,
      message: raw.confirmation.message,
      closureReasonLabel: raw.confirmation.closure_reason_label,
      closureReasonRequired: raw.confirmation.closure_reason_required,
    },
  };
}

async function patchTermState(
  syId: number,
  semesterNumber: number,
  status: "open" | "closed",
  reason?: string,
): Promise<string> {
  const data = await apiPatch<{ message?: string }>(
    `/school-years/${syId}/terms/${semesterNumber}/state`,
    { status, ...(reason ? { reason } : {}) },
  );
  return apiMessage(data);
}

export const termClosureService = {
  getContext,
  getStatus,
  getClosePreview,
  close,
  listClosures,
  getClosure,
  reopen,
  auditLogFilters,
  listAuditLog,
  getTermWorkflow,
  getSchoolYearClosePreview,
  closeSchoolYear,
  reopenSchoolYear,
  getLifecycle,
  getSchoolYearState,
  getSchoolYearStatePreview,
  patchSchoolYearState,
  getTermState,
  getTermStatePreview,
  patchTermState,
};
