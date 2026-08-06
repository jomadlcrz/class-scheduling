import { apiGet, apiMessage, apiPost } from "~/lib/api";
import { appendTermScopeParams } from "~/lib/term-scope";
import {
  DAY_LABELS,
  SCHEDULE_MODES,
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

const DAY_BY_LABEL = Object.fromEntries(
  (Object.entries(DAY_LABELS) as [Day, string][]).map(([short, label]) => [label, short]),
) as Record<string, Day>;

/** The backend title-cases modes on save ("F2F" is stored as "F2f") — same fix as schedule.service.ts. */
function normalizeMode(mode: string): ScheduleMode {
  return SCHEDULE_MODES.find((m) => m.toLowerCase() === mode.toLowerCase()) ?? "F2F";
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

/** GET /schedule-releases?sy_id=&semester_number=[&releaseStatus=] — registrar's releases for a term. */
async function listReleases(
  syId: number,
  semesterNumber: number,
  releaseStatus?: ScheduleReleaseStatus,
): Promise<ScheduleRelease[]> {
  const query = appendTermScopeParams(new URLSearchParams(), syId, semesterNumber);
  if (releaseStatus) query.set("releaseStatus", releaseStatus);
  const data = await apiGet<ApiScheduleRelease[]>(`/schedule-releases?${query}`);
  return data.map(mapRelease);
}

/** GET /schedule-releases/{id} */
async function getRelease(id: number): Promise<ScheduleRelease> {
  return mapRelease(await apiGet<ApiScheduleRelease>(`/schedule-releases/${id}`));
}

/** GET /schedule-releases/{id}/preview — read-only weekly grid for the registrar to review before submitting. */
async function getReleasePreview(id: number): Promise<SchedulePreview> {
  return mapPreview(await apiGet<ApiSchedulePreview>(`/schedule-releases/${id}/preview`));
}

/** POST /schedule-releases/{id}/submit — draft/rejected → pending_approval. Notifies the department's deans. */
async function submitRelease(id: number): Promise<{ message: string; release: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release: ApiScheduleRelease }>(
    `/schedule-releases/${id}/submit`,
  );
  return { message: apiMessage(data), release: mapRelease(data.release) };
}

/** POST /schedule-releases/{id}/withdraw — pending_approval → draft. */
async function withdrawRelease(id: number): Promise<{ message: string; release: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release: ApiScheduleRelease }>(
    `/schedule-releases/${id}/withdraw`,
  );
  return { message: apiMessage(data), release: mapRelease(data.release) };
}

/** GET /deans/schedule-approvals?sy_id=&semester_number= — dean's inbox, scoped to their department. */
async function listApprovals(syId: number, semesterNumber: number): Promise<DeanApprovalsInbox> {
  const query = appendTermScopeParams(new URLSearchParams(), syId, semesterNumber);
  const data = await apiGet<ApiDeanApprovalsInbox>(`/deans/schedule-approvals?${query}`);
  return {
    term: data.term,
    pending: data.pending.map(mapRelease),
    recentlyReviewed: data.recentlyReviewed.map(mapRelease),
  };
}

/** GET /deans/schedule-approvals/{id} — 403 if the release belongs to another department. */
async function getApproval(id: number): Promise<ScheduleRelease> {
  return mapRelease(await apiGet<ApiScheduleRelease>(`/deans/schedule-approvals/${id}`));
}

/** GET /deans/schedule-approvals/{id}/preview */
async function getApprovalPreview(id: number): Promise<SchedulePreview> {
  return mapPreview(await apiGet<ApiSchedulePreview>(`/deans/schedule-approvals/${id}/preview`));
}

/** POST /deans/schedule-approvals/{id}/approve — pending_approval → approved. Publishes the schedule. */
async function approveRelease(id: number): Promise<{ message: string; release: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release: ApiScheduleRelease }>(
    `/deans/schedule-approvals/${id}/approve`,
  );
  return { message: apiMessage(data), release: mapRelease(data.release) };
}

/** POST /deans/schedule-approvals/{id}/reject {reason} — pending_approval → rejected. Reason must be ≥10 chars. */
async function rejectRelease(id: number, reason: string): Promise<{ message: string; release: ScheduleRelease }> {
  const data = await apiPost<{ message?: string; release: ApiScheduleRelease }>(
    `/deans/schedule-approvals/${id}/reject`,
    { reason },
  );
  return { message: apiMessage(data), release: mapRelease(data.release) };
}

/**
 * Converts a release preview's daySchedules into the Schedule[] shape so the existing
 * ScheduleGrid/ScheduleTable components can render it read-only — no new grid renderer needed.
 * Fields the preview doesn't carry (schoolYear label, departmentCode) are left blank; neither
 * component reads them for display.
 */
function mapPreviewToSchedules(preview: SchedulePreview): Schedule[] {
  const { release, daySchedules } = preview;
  const schedules: Schedule[] = [];
  for (const day of daySchedules) {
    const dayCode = DAY_BY_LABEL[day.dayOfWeek] ?? "M";
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
        mode: normalizeMode(session.mode),
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
  listApprovals,
  getApproval,
  getApprovalPreview,
  approveRelease,
  rejectRelease,
  mapPreviewToSchedules,
};
