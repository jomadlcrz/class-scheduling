import { apiGet, apiMessage, apiPost } from "~/lib/api";
import { appendTermScopeParams } from "~/lib/term-scope";
import {
  parseTime12h,
  type Schedule,
  type ScheduleMode,
} from "~/types/schedule";
import type { YearLevel } from "~/types/subject";
import type {
  DeanApprovalsInbox,
  DeanProgramApprovalResult,
  DeanProgramApprovalsResponse,
  DeanProgramRejectResult,
  DeanReviewProgress,
  DeanSendAllToInstructorsResult,
  ProgramPublishResult,
  RegistrarRevisionWorkspace,
  ScheduleRelease,
  ScheduleReleaseStatus,
  SchedulePreview,
  SchedulePreviewDay,
} from "~/types/schedule-release";

/** Schedule release / dean approval workflow. */

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
): Promise<DeanProgramApprovalsResponse> {
  return apiGet<DeanProgramApprovalsResponse>(
    `/deans/program-approvals/${syId}/${semesterNumber}`,
  );
}

/** POST /deans/program-approvals/{syId}/{semesterNumber}/instructor-distributions — dean passes all waiting programs to instructors in one act. */
async function sendAllToInstructors(
  syId: number,
  semesterNumber: number,
): Promise<DeanSendAllToInstructorsResult> {
  const data = await apiPost<DeanSendAllToInstructorsResult & { message?: string }>(
    `/deans/program-approvals/${syId}/${semesterNumber}/instructor-distributions`,
  );
  return {
    ...data,
    message: apiMessage(data),
    sentSetIds: data.sentSetIds || [],
    programIds: data.programIds || [],
    blocked: data.blocked || [],
  };
}

/** POST /deans/program-approvals/{syId}/{semesterNumber}/{programId}/instructor-distributions — dean sends entire program to instructors. */
async function sendProgramToInstructors(
  syId: number,
  semesterNumber: number,
  programId: number,
): Promise<DeanProgramApprovalResult> {
  const data = await apiPost<DeanProgramApprovalResult & { message?: string }>(
    `/deans/program-approvals/${syId}/${semesterNumber}/${programId}/instructor-distributions`,
  );
  return {
    ...data,
    message: apiMessage(data),
    sentSetIds: data.sentSetIds || [],
    blocked: data.blocked || [],
    skippedSetIds: data.skippedSetIds || [],
  };
}

/** POST /deans/program-approvals/{syId}/{semesterNumber}/{programId}/rejections — dean returns entire program with reason. */
async function rejectProgram(
  syId: number,
  semesterNumber: number,
  programId: number,
  reason: string,
): Promise<DeanProgramRejectResult & { message: string }> {
  const data = await apiPost<DeanProgramRejectResult & { message?: string }>(
    `/deans/program-approvals/${syId}/${semesterNumber}/${programId}/rejections`,
    { reason },
  );
  return {
    ...data,
    message: apiMessage(data),
    rejectedSetIds: data.rejectedSetIds || [],
    skippedSetIds: data.skippedSetIds || [],
  };
}

/** POST .../revision-requests — sends final-approval schedules back to Registrar revision. */
async function returnProgramForRevision(
  syId: number,
  semesterNumber: number,
  programId: number,
  reason: string,
): Promise<DeanProgramRejectResult & { message: string }> {
  const data = await apiPost<{ message?: string; programAbbrev?: string; returnedSetIds?: number[] }>(
    `/deans/program-approvals/${syId}/${semesterNumber}/${programId}/revision-requests`,
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
    `/deans/program-approvals/${syId}/${semesterNumber}/${programId}/final-approvals`,
    { confirm },
  );
  return {
    ...data,
    message: apiMessage(data),
    approvedSetIds: data.approvedSetIds ?? [],
    blocked: data.blocked ?? [],
  };
}

/** GET /schedule-releases/{id}/preview — dean's view of a single release. */
async function getApproval(id: number): Promise<ScheduleRelease> {
  return mapRelease(await apiGet<ApiSchedulePreview>(`/schedule-releases/${id}/preview`).then((p) => p.release));
}

/** POST /deans/schedule-approvals/{id}/suggestion-forwards — forwards instructor suggestions to registrar. */
async function getReviewProgress(id: number): Promise<DeanReviewProgress> {
  return apiGet<DeanReviewProgress>(
    `/deans/schedule-approvals/${id}/review-progress`,
  );
}

/** POST /deans/schedule-approvals/{id}/suggestion-forwards — forwards instructor suggestions to registrar. */
async function forwardSuggestions(id: number): Promise<{ message: string; forwardedCount?: number }> {
  const data = await apiPost<{ message?: string; forwardedCount?: number }>(
    `/deans/schedule-approvals/${id}/suggestion-forwards`,
  );
  return { message: apiMessage(data), forwardedCount: data.forwardedCount };
}

/** POST /deans/schedule-approvals/{id}/final-review-transitions — moves to final approval when all accepted. */
async function progressToFinalApproval(id: number): Promise<{ message: string; release?: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release?: ApiScheduleRelease }>(
    `/deans/schedule-approvals/${id}/final-review-transitions`,
  );
  return { message: apiMessage(data), release: data.release ? mapRelease(data.release) : undefined };
}

/** POST /deans/schedule-approvals/{id}/final-approvals — final dean signoff. */
async function finalApprove(id: number): Promise<{ message: string; release?: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release?: ApiScheduleRelease }>(
    `/deans/schedule-approvals/${id}/final-approvals`,
  );
  return { message: apiMessage(data), release: data.release ? mapRelease(data.release) : undefined };
}

/** GET /registrar/schedule-releases/{id}/revision-workspace — registrar review of forwarded suggestions. */
async function getRevisionWorkspace(id: number): Promise<RegistrarRevisionWorkspace> {
  return apiGet<RegistrarRevisionWorkspace>(
    `/registrar/schedule-releases/${id}/revision-workspace`,
  );
}

/** POST /registrar/schedule-releases/{id}/resubmissions — registrar resubmits after resolving suggestions. */
async function resubmitRelease(id: number): Promise<{ message: string; release?: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release?: ApiScheduleRelease }>(
    `/registrar/schedule-releases/${id}/resubmissions`,
  );
  return { message: apiMessage(data), release: data.release ? mapRelease(data.release) : undefined };
}

/** POST /registrar/scheduling-terms/{syId}/{semesterNumber}/programs/{programId}/publications — publish program's schedule independently. */
async function publishProgramSchedule(
  syId: number,
  semesterNumber: number,
  programId: number,
): Promise<ProgramPublishResult> {
  const data = await apiPost<{
    message?: string;
    programAbbrev: string;
    published: number;
    alreadyPublished: number;
    setIds: number[];
    termFinalized: boolean;
  }>(`/registrar/scheduling-terms/${syId}/${semesterNumber}/programs/${programId}/publications`);
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
        subjectTitle: session.subjectTitle ?? "",
        setId: String(release.setId),
        setCode: release.setCode ?? "",
        program: release.programAbbrev ?? "",
        departmentCode: "",
        yearLevel: ([1, 2, 3, 4].includes(release.yearLevel ?? 0) ? release.yearLevel : 1) as YearLevel,
        facultyId: session.instructorId != null ? String(session.instructorId) : "",
        facultyName: session.instructorName ?? "Unassigned",
        roomId: session.roomId != null ? String(session.roomId) : "",
        roomName: session.roomName ?? "TBD",
        mode: (session.classMode ?? "") as ScheduleMode,
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
  listApprovals,
  listProgramApprovals,
  sendAllToInstructors,
  getApproval,
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


