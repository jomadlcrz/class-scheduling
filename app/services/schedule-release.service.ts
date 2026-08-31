import { apiGet, apiMessage, apiPost } from "~/lib/api";
import { appendTermScopeParams } from "~/lib/term-scope";
import {
  parseTime12h,
  type Day,
  type Schedule,
  type ScheduleMode,
} from "~/types/schedule";
import type { YearLevel } from "~/types/subject";
import type {
  DeanApprovalsInbox,
  ScheduleRelease,
  ScheduleReleaseStatus,
  SchedulePreview,
  SchedulePreviewDay,
} from "~/types/schedule-release";

/** Schedule release / dean approval workflow (10 endpoints, no frontend usage before this file). */

function normalizeMode(mode: string): ScheduleMode {
  return mode;
}

// The backend already serializes releases in camelCase (ScheduleReleaseService._serialize_release),
// unlike most other modules in this codebase — so these Api* types mirror the response 1:1.
type ApiScheduleRelease = ScheduleRelease;

type ApiSchedulePreview = {
  release: ApiScheduleRelease;
  daySchedules: SchedulePreviewDay[];
};

type ApiDeanApprovalsInbox = DeanApprovalsInbox;

function mapRelease(raw: ApiScheduleRelease): ScheduleRelease {
  return raw;
}

function mapPreview(raw: ApiSchedulePreview): SchedulePreview {
  return { release: mapRelease(raw.release), daySchedules: raw.daySchedules };
}

/** GET /schedule-releases?syId=&semester_number=[&releaseStatus=] — registrar's releases for a term. */
async function listReleases(
  syId: number,
  semesterNumber: number,
  releaseStatus?: ScheduleReleaseStatus,
): Promise<ScheduleRelease[]> {
  const query = new URLSearchParams({
    syId: String(syId),
    semester_number: String(semesterNumber),
  });
  if (releaseStatus) query.set("releaseStatus", releaseStatus);
  const data = await apiGet<ApiScheduleRelease[]>(`/schedule-releases?${query}`);
  return data.map(mapRelease);
}

/** GET /schedule-releases/{id}/preview — one release detail (backend has no standalone release detail endpoint). */
async function getRelease(id: number): Promise<ScheduleRelease> {
  const preview = await apiGet<ApiSchedulePreview>(`/schedule-releases/${id}/preview`);
  return mapRelease(preview.release);
}

/** GET /schedule-releases/{id}/preview — read-only weekly grid for the registrar to review before submitting. */
async function getReleasePreview(id: number): Promise<SchedulePreview> {
  return mapPreview(await apiGet<ApiSchedulePreview>(`/schedule-releases/${id}/preview`));
}

/**
 * Submit a release — draft/rejected → pending_dean_review.
 * NOTE: Backend does not yet have a release-level submit endpoint.
 * The registrar workflow uses scheduling-term program send instead.
 */
async function submitRelease(id: number, note?: string): Promise<{ message: string; release: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release: ApiScheduleRelease }>(
    `/schedule-releases/${id}/submit`,
    note ? { note } : undefined,
  );
  return { message: apiMessage(data), release: mapRelease(data.release) };
}

/**
 * Withdraw a release — pending_dean_review → draft.
 * NOTE: Backend does not yet have a release-level withdraw endpoint.
 * The registrar workflow uses scheduling-term program withdraw instead.
 */
async function withdrawRelease(id: number): Promise<{ message: string; release: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release: ApiScheduleRelease }>(
    `/schedule-releases/${id}/withdraw`,
  );
  return { message: apiMessage(data), release: mapRelease(data.release) };
}

/**
 * Send stray set to dean after term distribution.
 * NOTE: Backend does not yet have a release-level catch-up endpoint.
 */
async function catchUpRelease(id: number, note?: string): Promise<{ message: string; release: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release: ApiScheduleRelease }>(
    `/schedule-releases/${id}/catch-up`,
    note ? { note } : undefined,
  );
  return { message: apiMessage(data), release: mapRelease(data.release) };
}

export type ListApprovalsOptions = {
  releaseStatus?: string;
  programAbbrev?: string;
  setId?: number;
  yearLevel?: number;
  sort?: string;
  page?: number;
  perPage?: number;
};

/** GET /deans/schedule-approvals?sy_id=&semester_number= — dean's inbox, scoped to their department. */
async function listApprovals(
  syId: number,
  semesterNumber: number,
  options?: ListApprovalsOptions,
): Promise<DeanApprovalsInbox> {
  const query = appendTermScopeParams(new URLSearchParams(), syId, semesterNumber);
  if (options?.releaseStatus) query.set("release_status", options.releaseStatus);
  if (options?.programAbbrev) query.set("program_abbrev", options.programAbbrev);
  if (options?.setId != null) query.set("set_id", String(options.setId));
  if (options?.yearLevel != null) query.set("year_level", String(options.yearLevel));
  if (options?.sort) query.set("sort", options.sort);
  if (options?.page) query.set("page", String(options.page));
  if (options?.perPage) query.set("per_page", String(options.perPage));

  const data = await apiGet<ApiDeanApprovalsInbox>(`/deans/schedule-approvals?${query}`);
  return {
    term: data.term,
    stageCounts: data.stageCounts,
    summary: data.summary,
    filterOptions: data.filterOptions,
    items: data.items ? data.items.map(mapRelease) : undefined,
    pagination: data.pagination,
    pending: (data.pending || []).map(mapRelease),
    recentlyReviewed: (data.recentlyReviewed || []).map(mapRelease),
  };
}

/** GET /deans/program-approvals/{syId}/{semesterNumber} — dean's programs for the term, grouped by stage. */
async function listProgramApprovals(
  syId: number,
  semesterNumber: number,
): Promise<import("~/types/schedule-release").DeanProgramApprovalsResponse> {
  return apiGet<import("~/types/schedule-release").DeanProgramApprovalsResponse>(
    `/deans/program-approvals/${syId}/${semesterNumber}`,
  );
}

/** POST /deans/program-approvals/{syId}/{semesterNumber}/send-to-instructors — dean passes all waiting programs to instructors in one act. */
async function sendAllToInstructors(
  syId: number,
  semesterNumber: number,
): Promise<import("~/types/schedule-release").DeanSendAllToInstructorsResult> {
  const data = await apiPost<import("~/types/schedule-release").DeanSendAllToInstructorsResult & { message?: string }>(
    `/deans/program-approvals/${syId}/${semesterNumber}/send-to-instructors`,
  );
  return {
    ...data,
    message: apiMessage(data),
    sentSetIds: data.sentSetIds || [],
    programIds: data.programIds || [],
    blocked: data.blocked || [],
  };
}

/** POST /deans/program-approvals/{syId}/{semesterNumber}/{programId}/send-to-instructors — dean sends entire program to instructors. */
async function sendProgramToInstructors(
  syId: number,
  semesterNumber: number,
  programId: number,
): Promise<import("~/types/schedule-release").DeanProgramApprovalResult> {
  const data = await apiPost<import("~/types/schedule-release").DeanProgramApprovalResult & { message?: string }>(
    `/deans/program-approvals/${syId}/${semesterNumber}/${programId}/send-to-instructors`,
  );
  return {
    ...data,
    message: apiMessage(data),
    sentSetIds: data.sentSetIds || [],
    blocked: data.blocked || [],
    skippedSetIds: data.skippedSetIds || [],
  };
}

/** POST /deans/program-approvals/{syId}/{semesterNumber}/{programId}/reject — dean returns entire program with reason. */
async function rejectProgram(
  syId: number,
  semesterNumber: number,
  programId: number,
  reason: string,
): Promise<import("~/types/schedule-release").DeanProgramRejectResult & { message: string }> {
  const data = await apiPost<import("~/types/schedule-release").DeanProgramRejectResult & { message?: string }>(
    `/deans/program-approvals/${syId}/${semesterNumber}/${programId}/reject`,
    { reason },
  );
  return {
    ...data,
    message: apiMessage(data),
    rejectedSetIds: data.rejectedSetIds || [],
    skippedSetIds: data.skippedSetIds || [],
  };
}

/** POST .../return-for-revision — sends final-approval schedules back to Registrar revision. */
async function returnProgramForRevision(
  syId: number,
  semesterNumber: number,
  programId: number,
  reason: string,
): Promise<import("~/types/schedule-release").DeanProgramRejectResult & { message: string }> {
  const data = await apiPost<{ message?: string; programAbbrev?: string; returnedSetIds?: number[] }>(
    `/deans/program-approvals/${syId}/${semesterNumber}/${programId}/return-for-revision`,
    { reason },
  );
  return {
    programAbbrev: data.programAbbrev ?? "",
    message: apiMessage(data),
    rejectedSetIds: data.returnedSetIds ?? [],
    skippedSetIds: [],
  };
}

async function finalApproveProgram(
  syId: number,
  semesterNumber: number,
  programId: number,
  confirm: string,
): Promise<{ message: string; approvedSetIds: number[]; blocked: unknown[]; [key: string]: unknown }> {
  const data = await apiPost<{ message?: string; approvedSetIds?: number[]; blocked?: unknown[]; [key: string]: unknown }>(
    `/deans/program-approvals/${syId}/${semesterNumber}/${programId}/final-approve`,
    { confirm },
  );
  return {
    ...data,
    message: apiMessage(data),
    approvedSetIds: data.approvedSetIds ?? [],
    blocked: data.blocked ?? [],
  };
}

/** GET /deans/schedule-approvals/{id}/preview */
async function getApprovalPreview(id: number): Promise<SchedulePreview> {
  return mapPreview(await apiGet<ApiSchedulePreview>(`/deans/schedule-approvals/${id}/preview`));
}

/** GET /deans/schedule-approvals/{id} — dean-scoped release detail. */
async function getApproval(id: number): Promise<ScheduleRelease> {
  return mapRelease(await apiGet<ApiScheduleRelease>(`/deans/schedule-approvals/${id}`));
}

/**
 * Legacy initial-approval endpoint.
 * NOTE: The active workflow uses sendToInstructors → forwardSuggestions → finalApprove instead.
 * This is kept for backward compatibility but is no longer the primary approval path.
 */
async function approveRelease(id: number): Promise<{ message: string; release: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release: ApiScheduleRelease }>(
    `/deans/schedule-approvals/${id}/final-approve`,
  );
  return { message: apiMessage(data), release: mapRelease(data.release) };
}

/**
 * Reject a release — returns it to the Registrar as a draft.
 * Maps to the program-level reject endpoint since the backend has no release-level reject.
 */
async function rejectRelease(id: number, reason: string): Promise<{ message: string; release: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release: ApiScheduleRelease }>(
    `/deans/schedule-approvals/${id}/reject`,
    { reason },
  );
  return { message: apiMessage(data), release: mapRelease(data.release) };
}

/**
 * Send release to instructors for review.
 * Maps to the program-level send-to-instructors endpoint since the backend has no release-level endpoint.
 */
async function sendToInstructors(id: number): Promise<{ message: string; release: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release: ApiScheduleRelease }>(
    `/deans/schedule-approvals/${id}/send-to-instructors`,
  );
  return { message: apiMessage(data), release: mapRelease(data.release) };
}

/** GET /deans/schedule-approvals/{id}/review-progress — tracks instructor review progress. */
async function getReviewProgress(id: number): Promise<import("~/types/schedule-release").DeanReviewProgress> {
  return apiGet<import("~/types/schedule-release").DeanReviewProgress>(
    `/deans/schedule-approvals/${id}/review-progress`,
  );
}

/** POST /deans/schedule-approvals/{id}/forward-suggestions — forwards instructor suggestions to registrar. */
async function forwardSuggestions(id: number): Promise<{ message: string; forwardedCount?: number }> {
  const data = await apiPost<{ message?: string; forwardedCount?: number }>(
    `/deans/schedule-approvals/${id}/forward-suggestions`,
  );
  return { message: apiMessage(data), forwardedCount: data.forwardedCount };
}

/** POST /deans/schedule-approvals/{id}/progress-to-final-approval — moves to final approval when all accepted. */
async function progressToFinalApproval(id: number): Promise<{ message: string; release?: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release?: ApiScheduleRelease }>(
    `/deans/schedule-approvals/${id}/progress-to-final-approval`,
  );
  return { message: apiMessage(data), release: data.release ? mapRelease(data.release) : undefined };
}

/** POST /deans/schedule-approvals/{id}/final-approve — final dean signoff. */
async function finalApprove(id: number): Promise<{ message: string; release?: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release?: ApiScheduleRelease }>(
    `/deans/schedule-approvals/${id}/final-approve`,
  );
  return { message: apiMessage(data), release: data.release ? mapRelease(data.release) : undefined };
}

/** GET /registrar/schedule-releases/{id}/revision-workspace — registrar review of forwarded suggestions. */
async function getRevisionWorkspace(id: number): Promise<import("~/types/schedule-release").RegistrarRevisionWorkspace> {
  return apiGet<import("~/types/schedule-release").RegistrarRevisionWorkspace>(
    `/registrar/schedule-releases/${id}/revision-workspace`,
  );
}

/** POST /registrar/schedule-releases/{id}/resubmit — registrar resubmits after resolving suggestions. */
async function resubmitRelease(id: number): Promise<{ message: string; release?: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release?: ApiScheduleRelease }>(
    `/registrar/schedule-releases/${id}/resubmit`,
  );
  return { message: apiMessage(data), release: data.release ? mapRelease(data.release) : undefined };
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/programs/{programId}/publish — publish program's schedule independently. */
async function publishProgramSchedule(
  syId: number,
  semesterNumber: number,
  programId: number,
): Promise<import("~/types/schedule-release").ProgramPublishResult> {
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

import type { DayMapping } from "~/lib/day-utils";

/**
 * Converts a release preview's daySchedules into the Schedule[] shape so the existing
 * ScheduleGrid/ScheduleTable components can render it read-only — no new grid renderer needed.
 * Fields the preview doesn't carry (schoolYear label, departmentCode) are left blank; neither
 * component reads them for display.
 */
function mapPreviewToSchedules(preview: SchedulePreview, dayMap?: DayMapping | null): Schedule[] {
  const { release, daySchedules } = preview;
  const nameToCode = dayMap?.nameToCode ?? {};
  const schedules: Schedule[] = [];
  for (const day of daySchedules) {
    const dayCode = nameToCode[day.dayOfWeek] ?? "M";
    day.subjectSchedules.forEach((session, index) => {
      schedules.push({
        id: `${release.id}-${dayCode}-${index}`,
        schoolYear: "",
        semester: release.semesterNumber,
        subjectId: String(session.subjectId),
        subjectCode: session.subjectCode ?? "",
        subjectTitle: session.subjectCode ?? "",
        setId: String(release.setId),
        setCode: release.setCode ?? "",
        program: release.programAbbrev ?? "",
        departmentCode: "",
        yearLevel: ([1, 2, 3, 4].includes(release.yearLevel ?? 0) ? release.yearLevel : 1) as YearLevel,
        facultyId: session.instructorId != null ? String(session.instructorId) : "",
        facultyName: session.instructorName ?? "Unassigned",
        roomId: session.roomId != null ? String(session.roomId) : "",
        roomName: session.roomName ?? "TBD",
        mode: normalizeMode(session.classMode ?? ""),
        sessionMode: session.sessionMode ?? undefined,
        day: dayCode,
        startTime: parseTime12h(session.startTime),
        endTime: parseTime12h(session.endTime),
      });
    });
  }
  return schedules;
}

export const scheduleReleaseService = {
  listReleases,
  getRelease,
  getReleasePreview,
  submitRelease,
  withdrawRelease,
  catchUpRelease,
  listApprovals,
  listProgramApprovals,
  sendAllToInstructors,
  getApprovalPreview,
  getApproval,
  approveRelease,
  rejectRelease,
  sendToInstructors,
  sendProgramToInstructors,
  rejectProgram,
  returnProgramForRevision,
  finalApproveProgram,
  publishProgramSchedule,
  getReviewProgress,
  forwardSuggestions,
  progressToFinalApproval,
  finalApprove,
  getRevisionWorkspace,
  resubmitRelease,
  mapPreviewToSchedules,
};


