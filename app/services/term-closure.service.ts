import { apiGet, apiMessage, apiPost } from "~/lib/api";
import type {
  TermAuditLogEntry,
  TermAuditLogFilters,
  TermAuditLogResult,
  TermClosureHistoryEntry,
  TermClosureItem,
  TermClosureTermInformation,
  TermClosureUser,
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
  semester: string;
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
  sem_id: number;
  school_year: string;
  semester_number: number;
  semester_display_name: string;
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
    semester: raw.semester,
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
    semId: raw.sem_id,
    schoolYear: raw.school_year,
    semesterNumber: raw.semester_number,
    semesterDisplayName: raw.semester_display_name,
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

export type TermContext = {
  schoolYears: { id: number; schoolYear: string }[];
  semesters: { semesterNumber: number; label: string; semId?: number }[];
  selection: { syId: number | null; semId: number | null; semesterNumber: number | null; schoolYear: string | null };
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
    semesters: { semester_number: number; display_name: string }[];
    selection: { sy_id: number | null; sem_id: number | null; semester_number: number | null; school_year: string | null };
    term: ApiTermClosureItem | null;
    calendar: { academic_year_start_month: number; current_school_year: string | null; current_semester_number: number | null; exists_for_today: boolean | null; expected_school_year: string | null };
  }>(`/terms/context${query.size ? `?${query}` : ""}`);
  return {
    schoolYears: raw.school_years.map((row) => ({ id: row.id, schoolYear: row.school_year })),
    semesters: raw.semesters.map((row) => ({ semesterNumber: row.semester_number, label: row.display_name })),
    selection: { syId: raw.selection.sy_id, semId: raw.selection.sem_id, semesterNumber: raw.selection.semester_number, schoolYear: raw.selection.school_year },
    term: raw.term ? mapClosureItem(raw.term) : null,
    calendar: { academicYearStartMonth: raw.calendar.academic_year_start_month, currentSchoolYear: raw.calendar.current_school_year, currentSemesterNumber: raw.calendar.current_semester_number, existsForToday: raw.calendar.exists_for_today, expectedSchoolYear: raw.calendar.expected_school_year },
  };
}

/** GET /terms/status — closure status and reason for one school-year/semester pair. */
async function getStatus(syId: number, semId: number): Promise<TermClosureItem> {
  const raw = await apiGet<ApiTermClosureItem>(`/terms/status?sy_id=${syId}&sem_id=${semId}`);
  return mapClosureItem(raw);
}

/** POST /terms/close — locks a term against further scheduling and record changes. */
async function close(syId: number, semId: number, reason?: string): Promise<string> {
  const data = await apiPost<{ message?: string }>("/terms/close", { syId, semId, ...(reason ? { reason } : {}) });
  return apiMessage(data);
}

/** GET /terms/closures — registrar-posted closures, newest first. */
async function listClosures(): Promise<TermClosureItem[]> {
  const data = await apiGet<{ items: ApiTermClosureItem[] }>("/terms/closures");
  return data.items.map(mapClosureItem);
}

/** POST /terms/reopen */
async function reopen(syId: number, semesterNumber: number, reason?: string): Promise<string> {
  const data = await apiPost<{ message?: string }>("/terms/reopen", {
    syId,
    semesterNumber,
    ...(reason ? { reason } : {}),
  });
  return apiMessage(data);
}

/** GET /terms/audit-log/filters */
async function auditLogFilters(): Promise<TermAuditLogFilters> {
  const data = await apiGet<{
    school_years: { id: number; school_year: string }[];
    semesters: { id: number; semester_number: number; display_name: string }[];
    actions: { value: string; label: string }[];
    performed_by: { user_id: number; display: string }[];
  }>("/terms/audit-log/filters");

  return {
    schoolYears: data.school_years.map((row) => ({ id: row.id, schoolYear: row.school_year })),
    semesters: data.semesters.map((row) => ({
      id: row.id,
      semesterNumber: row.semester_number,
      displayName: row.display_name,
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

export const termClosureService = { getContext, getStatus, close, listClosures, reopen, auditLogFilters, listAuditLog };
