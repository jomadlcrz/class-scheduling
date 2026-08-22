import { apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
import type {
  DeadlinesUpdatePayload,
  DeadlinesUpdateResult,
  DepartmentReadinessResponse,
  TermAdvanceAction,
  TermDistributionReadiness,
  TermPhaseResponse,
  TermResolutionRun,
} from "~/types/term-phase";

/** GET /scheduling-terms/{syId}/{semesterNumber} — readable by every role. */
async function getTermPhase(syId: number, semesterNumber: number): Promise<TermPhaseResponse> {
  return apiGet<TermPhaseResponse>(`/scheduling-terms/${syId}/${semesterNumber}`);
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

/** GET /registrar/scheduling-terms/{syId}/{semesterNumber}/phase-windows — all five phase windows with opensAt and closesAt. */
async function getPhaseWindows(
  syId: number,
  semesterNumber: number,
): Promise<import("~/types/term-phase").TermPhaseWindowsResponse> {
  return apiGet<import("~/types/term-phase").TermPhaseWindowsResponse>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/phase-windows`,
  );
}

/** PUT /registrar/scheduling-terms/{syId}/{semesterNumber}/phase-windows/{phase} — set opensAt/closesAt for one phase. */
async function setPhaseWindow(
  syId: number,
  semesterNumber: number,
  phase: string,
  payload: import("~/types/term-phase").SetPhaseWindowPayload,
): Promise<import("~/types/term-phase").SetPhaseWindowResult> {
  const data = await apiPut<import("~/types/term-phase").SetPhaseWindowResult>(
    `/registrar/scheduling-terms/${syId}/${semesterNumber}/phase-windows/${encodeURIComponent(phase)}`,
    payload,
  );
  return {
    ...data,
    message: apiMessage(data),
  };
}

export const termPhaseService = {
  getTermPhase,
  getDistributionReadiness,
  getDepartmentReadiness,
  sendProgram,
  withdrawProgram,
  sendDepartment,
  setDeadlines,
  advancePhase,
  rewindPhase,
  openPhase,
  getResolution,
  previewResolution,
  getPhaseWindows,
  setPhaseWindow,
};
