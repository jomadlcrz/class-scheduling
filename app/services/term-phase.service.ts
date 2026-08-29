import { apiDelete, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
import type {
  DeadlinesUpdatePayload,
  DeadlinesUpdateResult,
  DepartmentReadinessResponse,
  MajorSchedulingExtension,
  TermAdvanceAction,
  TermDistributionReadiness,
  TermPhaseResponse,
  TermResolutionRun,
  SchedulingWindowName,
  SchedulingWindowsSnapshot,
} from "~/types/term-phase";

/** GET /scheduling-terms/{syId}/{semesterNumber} — readable by every role. */
async function getTermPhase(syId: number, semesterNumber: number): Promise<TermPhaseResponse> {
  return apiGet<TermPhaseResponse>(`/scheduling-terms/${syId}/${semesterNumber}`);
}

/** GET /scheduling-terms/current — the active running term's calendar. */
async function getCurrentTermPhase(): Promise<TermPhaseResponse> {
  return apiGet<TermPhaseResponse>("/scheduling-terms/current");
}

/** GET /registrar/scheduling-terms/{syId}/{semesterNumber}/readiness — term distribution readiness. */
async function getDistributionReadiness(
  syId: number,
  semesterNumber: number,
): Promise<TermDistributionReadiness> {
  return apiGet<TermDistributionReadiness>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/readiness`,
  );
}

/** GET /registrar/scheduling-terms/{syId}/{semesterNumber}/department-readiness — department breakdown. */
async function getDepartmentReadiness(
  syId: number,
  semesterNumber: number,
): Promise<DepartmentReadinessResponse> {
  return apiGet<DepartmentReadinessResponse>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/department-readiness`,
  );
}

/** @deprecated Major scheduling extensions were removed — window is institution-wide only. */
async function getMajorExtensions(_syId: number, _semesterNumber: number): Promise<MajorSchedulingExtension[]> {
  return [];
}

export type TermResponseReadiness = {
  allResponded: boolean;
  pendingCount: number;
  [key: string]: unknown;
};

async function getResponseReadiness(
  syId: number,
  semesterNumber: number,
): Promise<TermResponseReadiness> {
  return apiGet<TermResponseReadiness>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/response-readiness`,
  );
}

export type SuggestionPolicy = {
  attemptLimit: number;
  previousLimit?: number;
  changed?: boolean;
  message: string;
};

async function setSuggestionPolicy(
  syId: number,
  semesterNumber: number,
  attemptLimit: number,
): Promise<SuggestionPolicy> {
  const data = await apiPut<Omit<SuggestionPolicy, "message"> & { message?: string }>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/suggestion-policy`,
    { attemptLimit },
  );
  return { ...data, message: apiMessage(data) };
}

export type MajorEditRequestPolicy = {
  attemptLimit: number;
  previousLimit?: number;
  changed?: boolean;
  message: string;
};

async function setMajorEditRequestPolicy(
  syId: number,
  semesterNumber: number,
  attemptLimit: number,
): Promise<MajorEditRequestPolicy> {
  const data = await apiPut<Omit<MajorEditRequestPolicy, "message"> & { message?: string }>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/major-edit-request-policy`,
    { attemptLimit },
  );
  return { ...data, message: apiMessage(data) };
}

/** GET .../major-edit-request-attempts — Dean counters for the Major window. */
async function getMajorEditRequestAttempts(
  syId: number,
  semesterNumber: number,
): Promise<import("~/types/term-phase").MajorEditRequestAttemptSummary> {
  return apiGet<import("~/types/term-phase").MajorEditRequestAttemptSummary>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/major-edit-request-attempts`,
  );
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/programs/{programId}/send — sends one program's schedules to dean. */
async function sendProgram(
  syId: number,
  semesterNumber: number,
  programId: number,
  note?: string,
): Promise<{ message: string; programAbbrev: string; sentSetIds: number[]; termDistributed: boolean }> {
  const data = await apiPost<{
    message?: string;
    programAbbrev: string;
    sentSetIds: number[];
    termDistributed: boolean;
  }>(`/registrar/scheduling-terms/${syId}/${semesterNumber}/programs/${programId}/send`, {
    note: note || undefined,
  });
  return {
    message: apiMessage(data),
    programAbbrev: data.programAbbrev,
    sentSetIds: data.sentSetIds || [],
    termDistributed: Boolean(data.termDistributed),
  };
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/programs/{programId}/withdraw — withdraws program from dean review. */
async function withdrawProgram(
  syId: number,
  semesterNumber: number,
  programId: number,
): Promise<{ message: string; programAbbrev: string; withdrawnSetIds: number[] }> {
  const data = await apiPost<{
    message?: string;
    programAbbrev: string;
    withdrawnSetIds: number[];
  }>(`/registrar/scheduling-terms/${syId}/${semesterNumber}/programs/${programId}/withdraw`);
  return {
    message: apiMessage(data),
    programAbbrev: data.programAbbrev,
    withdrawnSetIds: data.withdrawnSetIds || [],
  };
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/departments/{departmentId}/send — sends entire department to dean. */
async function sendDepartment(
  syId: number,
  semesterNumber: number,
  departmentId: number,
): Promise<{ message: string; departmentAbbrev: string; sentSetIds: number[]; termDistributed: boolean }> {
  const data = await apiPost<{
    message?: string;
    departmentAbbrev: string;
    sentSetIds: number[];
    termDistributed: boolean;
  }>(`/registrar/scheduling-terms/${syId}/${semesterNumber}/departments/${departmentId}/send`);
  return {
    message: apiMessage(data),
    departmentAbbrev: data.departmentAbbrev,
    sentSetIds: data.sentSetIds || [],
    termDistributed: Boolean(data.termDistributed),
  };
}

/** PUT /registrar/scheduling-terms/{syId}/{semesterNumber}/deadlines — set/move/clear deadlines. */
async function setDeadlines(
  syId: number,
  semesterNumber: number,
  payload: DeadlinesUpdatePayload,
): Promise<DeadlinesUpdateResult & { message: string }> {
  const data = await apiPut<DeadlinesUpdateResult & { message?: string }>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/deadlines`,
    payload,
  );
  return {
    ...data,
    message: apiMessage(data),
  };
}

/** GET /registrar/scheduling-terms/{syId}/{semesterNumber}/windows — current window state and history. */
async function getSchedulingWindows(
  syId: number,
  semesterNumber: number,
): Promise<SchedulingWindowsSnapshot> {
  return apiGet<SchedulingWindowsSnapshot>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/windows`,
  );
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/windows/{window}/open. */
async function openSchedulingWindow(
  syId: number,
  semesterNumber: number,
  window: SchedulingWindowName,
  scheduledClosingAt: string,
  confirmed = false,
): Promise<{ message: string; state: SchedulingWindowsSnapshot }> {
  const data = await apiPost<{ message?: string; state: SchedulingWindowsSnapshot }>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/windows/${window}/open`,
    { scheduledClosingAt, confirmed },
  );
  return { ...data, message: apiMessage(data) };
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/windows/{window}/close. */
async function closeSchedulingWindow(
  syId: number,
  semesterNumber: number,
  window: SchedulingWindowName,
): Promise<{ message: string; state: SchedulingWindowsSnapshot }> {
  const data = await apiPost<{ message?: string; state: SchedulingWindowsSnapshot }>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/windows/${window}/close`,
  );
  return { ...data, message: apiMessage(data) };
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/advance — advance term phase. */
async function advancePhase(
  syId: number,
  semesterNumber: number,
  action: TermAdvanceAction,
): Promise<{ message: string; term: TermPhaseResponse; [key: string]: unknown }> {
  const data = await apiPost<{ message?: string; term: TermPhaseResponse; [key: string]: unknown }>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/advance`,
    { action },
  );
  return {
    ...data,
    message: apiMessage(data),
  };
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/rewind — step term back one phase. */
async function rewindPhase(
  syId: number,
  semesterNumber: number,
): Promise<{ message: string; term: TermPhaseResponse; undone: string[] }> {
  const data = await apiPost<{ message?: string; term: TermPhaseResponse; undone?: string[] }>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/rewind`,
  );
  return {
    ...data,
    message: apiMessage(data),
    term: data.term,
    undone: data.undone || [],
  };
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/phases/{phase}/open — reopen a specific phase. */
async function openPhase(
  syId: number,
  semesterNumber: number,
  phase: string,
): Promise<{ message: string; term: TermPhaseResponse; undone: string[] }> {
  const data = await apiPost<{ message?: string; term: TermPhaseResponse; undone?: string[] }>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/phases/${encodeURIComponent(phase)}/open`,
  );
  return {
    ...data,
    message: apiMessage(data),
    term: data.term,
    undone: data.undone || [],
  };
}

/** GET /registrar/scheduling-terms/{syId}/{semesterNumber}/resolution — latest resolution run or null. */
async function getResolution(
  syId: number,
  semesterNumber: number,
): Promise<TermResolutionRun | null> {
  return apiGet<TermResolutionRun | null>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/resolution`,
  );
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/resolution/preview — solve without committing. */
async function previewResolution(
  syId: number,
  semesterNumber: number,
): Promise<{ message: string; resolution: TermResolutionRun }> {
  const data = await apiPost<{ message?: string; resolution: TermResolutionRun }>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/resolution/preview`,
  );
  return {
    message: apiMessage(data),
    resolution: data.resolution,
  };
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/programs/{programId}/publish — publish program's schedule independently. */
async function publishProgramSchedule(
  syId: number,
  semesterNumber: number,
  programId: number,
): Promise<{
  message: string;
  programAbbrev: string;
  published: number;
  alreadyPublished: number;
  setIds: number[];
  termFinalized: boolean;
}> {
  const data = await apiPost<{
    message?: string;
    programAbbrev: string;
    published: number;
    alreadyPublished: number;
    setIds: number[];
    termFinalized: boolean;
  }>(`/registrar/scheduling-terms/${syId}/${semesterNumber}/programs/${programId}/publish`);
  return {
    message: apiMessage(data),
    programAbbrev: data.programAbbrev,
    published: data.published,
    alreadyPublished: data.alreadyPublished,
    setIds: data.setIds,
    termFinalized: data.termFinalized,
  };
}

export const termPhaseService = {
  getTermPhase,
  getCurrentTermPhase,
  getDistributionReadiness,
  getDepartmentReadiness,
  getMajorExtensions,
  getResponseReadiness,
  setSuggestionPolicy,
  setMajorEditRequestPolicy,
  getMajorEditRequestAttempts,
  sendProgram,
  withdrawProgram,
  sendDepartment,
  publishProgramSchedule,
  setDeadlines,
  getSchedulingWindows,
  openSchedulingWindow,
  closeSchedulingWindow,
  advancePhase,
  rewindPhase,
  openPhase,
  getResolution,
  previewResolution,
};

