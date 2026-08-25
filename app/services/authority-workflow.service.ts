import { apiDelete, apiGet, apiGetFresh, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type {
  AssignmentAuditLog,
  HoursAdjustmentRequest,
  InstructorScheduleResponse,
  MajorSchedule,
  MajorScheduleConflict,
  MajorScheduleAuditLogResult,
  MajorScheduleRequirements,
  MajorScheduleEditRequest,
  MajorScheduleMeetingInput,
  MajorScheduleSubmission,
  ProposedScheduleMeeting,
} from "~/types/authority-workflow";

type MessageResponse = { message?: string };

async function listAssignmentAuditLogs(params: {
  teachingTermId?: number;
  syId?: number;
  semesterNumber?: number;
  departmentId?: number;
  instructorProfileId?: number;
  action?: string;
} = {}): Promise<AssignmentAuditLog[]> {
  const query = new URLSearchParams();
  if (params.teachingTermId != null) query.set("teaching_term_id", String(params.teachingTermId));
  if (params.syId != null) query.set("sy_id", String(params.syId));
  if (params.semesterNumber != null) query.set("semester_number", String(params.semesterNumber));
  if (params.departmentId != null) query.set("department_id", String(params.departmentId));
  if (params.instructorProfileId != null) query.set("instructor_profile_id", String(params.instructorProfileId));
  if (params.action) query.set("action", params.action);
  const rows = await apiGet<Record<string, unknown>[]>(`/deans/audit-logs/assignments${query.size ? `?${query}` : ""}`);
  return rows.map((row) => ({
    id: Number(row.id),
    action: String(row.action ?? ""),
    actionLabel: String(row.action_label ?? row.action ?? ""),
    teachingTermId: row.teaching_term_id == null ? null : Number(row.teaching_term_id),
    departmentId: row.department_id == null ? null : Number(row.department_id),
    departmentName: row.department_name == null ? null : String(row.department_name),
    instructorProfileId: row.instructor_profile_id == null ? null : Number(row.instructor_profile_id),
    instructorName: row.instructor_name == null ? null : String(row.instructor_name),
    syId: row.sy_id == null ? null : Number(row.sy_id),
    schoolYear: row.school_year == null ? null : String(row.school_year),
    semesterNumber: row.semester_number == null ? null : Number(row.semester_number),
    subjectId: row.subject_id == null ? null : Number(row.subject_id),
    subjectCode: row.subject_code == null ? null : String(row.subject_code),
    previousValue: row.previous_value == null ? null : String(row.previous_value),
    newValue: row.new_value == null ? null : String(row.new_value),
    performerName: row.performer_name == null ? null : String(row.performer_name),
    role: row.role == null ? null : String(row.role),
    details: row.details == null ? null : String(row.details),
    createdAt: String(row.created_at ?? ""),
  }));
}

async function listHoursAdjustmentRequests(params: {
  syId?: number;
  semesterNumber?: number;
  departmentId?: number;
  status?: string;
} = {}): Promise<HoursAdjustmentRequest[]> {
  const query = new URLSearchParams();
  if (params.syId != null) query.set("sy_id", String(params.syId));
  if (params.semesterNumber != null) query.set("semester_number", String(params.semesterNumber));
  if (params.departmentId != null) query.set("department_id", String(params.departmentId));
  if (params.status) query.set("status", params.status);
  const data = await apiGet<{ requests: HoursAdjustmentRequest[] }>(`/deans/hours-adjustment-requests${query.size ? `?${query}` : ""}`);
  return data.requests ?? [];
}

async function requestHoursAdjustment(teachingTermId: number, requestedHours: number, reason: string) {
  const data = await apiPost<MessageResponse & { request: HoursAdjustmentRequest }>(
    `/deans/teaching-terms/${teachingTermId}/hours-adjustment-requests`,
    { requestedHours, reason },
  );
  return { message: apiMessage(data), request: data.request };
}

async function decideHoursAdjustment(requestId: number, decision: "approved" | "rejected", message?: string) {
  const data = await apiPost<MessageResponse & { request: HoursAdjustmentRequest }>(
    `/deans/hours-adjustment-requests/${requestId}/decision`,
    { decision, message },
  );
  return { message: apiMessage(data), request: data.request };
}

async function createMajorSchedule(input: MajorScheduleMeetingInput, audience: "dean" | "registrar" = "dean") {
  const data = await apiPost<MessageResponse & { schedule: MajorSchedule }>(`/${audience === "dean" ? "deans" : "registrar"}/major-schedules`, input);
  return { message: apiMessage(data), schedule: data.schedule };
}

async function updateMajorSchedule(id: number, input: MajorScheduleMeetingInput, audience: "dean" | "registrar") {
  const data = await apiPut<MessageResponse & { schedule: MajorSchedule }>(`/${audience === "dean" ? "deans" : "registrar"}/major-schedules/${id}`, input);
  return { message: apiMessage(data), schedule: data.schedule };
}

async function deleteMajorSchedule(id: number, audience: "dean" | "registrar" = "dean", reason?: string): Promise<string> {
  return apiMessage(await apiDelete<MessageResponse>(
    `/${audience === "dean" ? "deans" : "registrar"}/major-schedules/${id}`,
    audience === "registrar" ? { reason } : undefined,
  ));
}

async function listMajorScheduleSubmissions(params: {
  syId?: number;
  semesterNumber?: number;
  buildingId?: number;
  roomId?: number;
  departmentId?: number;
  status?: string;
} = {}): Promise<MajorScheduleSubmission[]> {
  const query = new URLSearchParams();
  if (params.syId != null) query.set("syId", String(params.syId));
  if (params.semesterNumber != null) query.set("semesterNumber", String(params.semesterNumber));
  if (params.buildingId != null) query.set("buildingId", String(params.buildingId));
  if (params.roomId != null) query.set("roomId", String(params.roomId));
  if (params.departmentId != null) query.set("departmentId", String(params.departmentId));
  if (params.status) query.set("status", params.status);
  // A Registrar can decide a Dean's edit request from a separate session.
  // Submission status must therefore bypass the shared 60-second GET cache.
  const data = await apiGetFresh<{ submissions: MajorScheduleSubmission[] }>(`/major-schedule-submissions${query.size ? `?${query}` : ""}`);
  return data.submissions ?? [];
}

async function listMajorLabTimeSlots() {
  return apiGet<{ labTimeSlots: { startTime: string; endTime: string }[]; requiredMeetingHours: number | null }>("/major-schedule-lab-time-slots");
}

async function submitMajorSchedule(submissionId: number) {
  const data = await apiPost<MessageResponse & { submission: { id: number; status: string; version: number } }>(`/deans/major-schedule-submissions/${submissionId}/submit`);
  return { message: apiMessage(data), submission: data.submission };
}

async function requestMajorScheduleEdit(submissionId: number, reason: string) {
  const data = await apiPost<MessageResponse & { editRequest: { id: number; status: string } }>(`/deans/major-schedule-submissions/${submissionId}/edit-requests`, { reason });
  return { message: apiMessage(data), editRequest: data.editRequest };
}

async function decideMajorScheduleEdit(requestId: number, approve: boolean, note?: string) {
  const data = await apiPost<MessageResponse & { editRequest: { id: number; status: string } }>(`/registrar/major-schedule-edit-requests/${requestId}/decision`, { approve, note });
  return { message: apiMessage(data), editRequest: data.editRequest };
}

async function listMajorScheduleEditRequests(status?: string): Promise<MajorScheduleEditRequest[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await apiGet<{ editRequests: MajorScheduleEditRequest[] }>(`/registrar/major-schedule-edit-requests${query}`);
  return data.editRequests ?? [];
}

async function getMajorScheduleConflicts(submissionId: number) {
  return apiGet<{ message?: string; conflicts: MajorScheduleConflict[]; conflictCount: number }>(`/registrar/major-schedule-submissions/${submissionId}/conflicts`);
}

async function getMajorScheduleRequirements(submissionId: number): Promise<MajorScheduleRequirements> {
  return apiGet<MajorScheduleRequirements>(`/registrar/major-schedule-submissions/${submissionId}/requirements`);
}

async function listMajorScheduleAuditLogs(params: {
  syId?: number;
  semesterNumber?: number;
  departmentId?: number;
  submissionId?: number;
  action?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<MajorScheduleAuditLogResult> {
  const query = new URLSearchParams();
  if (params.syId != null) query.set("syId", String(params.syId));
  if (params.semesterNumber != null) query.set("semesterNumber", String(params.semesterNumber));
  if (params.departmentId != null) query.set("departmentId", String(params.departmentId));
  if (params.submissionId != null) query.set("submissionId", String(params.submissionId));
  if (params.action) query.set("action", params.action);
  if (params.page != null) query.set("page", String(params.page));
  if (params.perPage != null) query.set("perPage", String(params.perPage));
  return apiGet<MajorScheduleAuditLogResult>(`/major-schedule-audit-logs${query.size ? `?${query}` : ""}`);
}

async function finalizeMajorSchedule(submissionId: number, reason: string = "Approved and protected by Registrar.") {
  const data = await apiPost<MessageResponse & { submission: { id: number; status: string } }>(
    `/registrar/major-schedule-submissions/${submissionId}/finalize`,
    { reason },
  );
  return { message: apiMessage(data), submission: data.submission };
}

async function reopenFinalizedMajorSchedule(submissionId: number, reason: string) {
  const data = await apiPost<MessageResponse & { submission: { id: number; status: string } }>(
    `/registrar/major-schedule-submissions/${submissionId}/reopen`,
    { reason },
  );
  return { message: apiMessage(data), submission: data.submission };
}

async function respondToInstructorSchedule(scheduleId: number, input: {
  responseType: "accept" | "suggest_change";
  reason?: string;
  meetings?: ProposedScheduleMeeting[];
}) {
  const data = await apiPost<MessageResponse & { response: { id: number; status: string; responseType: string } }>(`/instructors/schedules/${scheduleId}/response`, input);
  return { message: apiMessage(data), response: data.response };
}

async function listInstructorScheduleResponses(status?: string): Promise<InstructorScheduleResponse[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await apiGet<{ responses: InstructorScheduleResponse[] }>(`/instructor-schedule-responses${query}`);
  return data.responses ?? [];
}

async function decideInstructorScheduleResponse(responseId: number, audience: "deans" | "registrar", approve: boolean, note?: string) {
  const data = await apiPost<MessageResponse & { response?: InstructorScheduleResponse; applied?: boolean; conflicts?: unknown[] }>(`/${audience}/instructor-schedule-responses/${responseId}/decision`, { approve, note });
  return { message: apiMessage(data), response: data.response, applied: data.applied, conflicts: data.conflicts };
}

async function assignFloatingInstructor(scheduleId: number, instructorId: number) {
  const data = await apiPatch<MessageResponse & { schedule: MajorSchedule }>(`/registrar/floating-schedules/${scheduleId}/assign-instructor`, { instructorId });
  return { message: apiMessage(data), schedule: data.schedule };
}

/** GET /instructors/schedule-reviews — list schedule releases open for instructor review. */
async function listInstructorScheduleReviews(): Promise<import("~/types/authority-workflow").InstructorScheduleReviewSummary[]> {
  const data = await apiGet<{ reviews: import("~/types/authority-workflow").InstructorScheduleReviewSummary[] }>(
    "/instructors/schedule-reviews",
  );
  return data.reviews ?? [];
}

/** GET /instructors/schedule-reviews/{id} — instructor review detail with meetings. */
async function getInstructorScheduleReview(releaseId: number): Promise<import("~/types/authority-workflow").InstructorScheduleReviewDetail> {
  return apiGet<import("~/types/authority-workflow").InstructorScheduleReviewDetail>(
    `/instructors/schedule-reviews/${releaseId}`,
  );
}

async function listInstructorScheduleReviewHistory(): Promise<unknown[]> {
  const data = await apiGet<{ requests: unknown[] }>("/instructors/schedule-reviews/history");
  return data.requests ?? [];
}

async function setAcceptedSchedules(releaseId: number, scheduleIds: number[], accepted: boolean) {
  return apiPut<{ message?: string; acceptedScheduleIds: number[] }>(
    `/instructors/schedule-reviews/${releaseId}/accepted-schedules`,
    { scheduleIds, accepted },
  );
}

async function acceptAllInstructorScheduleReviews(syId: number, semesterNumber: number) {
  return apiPost<{ message?: string; [key: string]: unknown }>(
    "/instructors/schedule-reviews/accept-all",
    { syId, semesterNumber },
  );
}

/** POST /instructors/schedule-reviews/{id}/accept — instructor accepts assigned schedule. */
async function acceptInstructorScheduleReview(releaseId: number): Promise<{ message: string; response?: unknown }> {
  const data = await apiPost<MessageResponse & { response?: unknown }>(
    `/instructors/schedule-reviews/${releaseId}/accept`,
  );
  return { message: apiMessage(data), response: data.response };
}

/** POST /instructors/schedule-reviews/{id}/suggest — instructor submits proposed meeting schedule. */
async function suggestInstructorScheduleChange(
  releaseId: number,
  payload: { reason?: string; proposedMeetings: ProposedScheduleMeeting[] },
): Promise<{ message: string; response?: unknown }> {
  const data = await apiPost<MessageResponse & { response?: unknown }>(
    `/instructors/schedule-reviews/${releaseId}/suggest`,
    payload,
  );
  return { message: apiMessage(data), response: data.response };
}

/** POST /registrar/instructor-schedule-responses/{id}/analyze — dry-run analyze suggestion placement. */
async function analyzeInstructorSuggestion(responseId: number): Promise<import("~/types/authority-workflow").SuggestionDryRunAnalysis> {
  return apiPost<import("~/types/authority-workflow").SuggestionDryRunAnalysis>(
    `/registrar/instructor-schedule-responses/${responseId}/analyze`,
  );
}

/** POST /registrar/instructor-schedule-responses/{id}/apply — registrar applies approved suggestion to timetable. */
async function applyInstructorSuggestion(responseId: number, note?: string): Promise<{ message: string; applied?: boolean }> {
  const data = await apiPost<MessageResponse & { applied?: boolean }>(
    `/registrar/instructor-schedule-responses/${responseId}/apply`,
    note ? { note } : undefined,
  );
  return { message: apiMessage(data), applied: data.applied };
}

/** POST /registrar/instructor-schedule-responses/{id}/retain — registrar rejects suggestion, retaining original schedule. */
async function retainInitialSchedule(responseId: number, note?: string): Promise<{ message: string; retained?: boolean }> {
  const data = await apiPost<MessageResponse & { retained?: boolean }>(
    `/registrar/instructor-schedule-responses/${responseId}/retain`,
    note ? { note } : undefined,
  );
  return { message: apiMessage(data), retained: data.retained };
}

async function previewRetention(responseId: number) {
  return apiPost<{ message?: string; [key: string]: unknown }>(
    `/registrar/instructor-schedule-responses/${responseId}/retention-preview`,
  );
}

/** POST /registrar/instructor-schedule-responses/{id}/analyze-advanced — progressive multi-level dry-run solver. */
async function analyzeAdvancedAdjustment(responseId: number): Promise<import("~/types/authority-workflow").AdvancedAnalysisResult> {
  return apiPost<import("~/types/authority-workflow").AdvancedAnalysisResult>(
    `/registrar/instructor-schedule-responses/${responseId}/analyze-advanced`,
  );
}

/** POST /registrar/instructor-schedule-responses/{id}/apply-with-adjustments — apply suggestion by adjusting blocking classes. */
async function applySuggestionWithAdjustments(responseId: number, note?: string): Promise<{ message: string; applied?: boolean }> {
  const data = await apiPost<MessageResponse & { applied?: boolean }>(
    `/registrar/instructor-schedule-responses/${responseId}/apply-with-adjustments`,
    note ? { note } : undefined,
  );
  return { message: apiMessage(data), applied: data.applied };
}

export const authorityWorkflowService = {
  listAssignmentAuditLogs,
  listHoursAdjustmentRequests,
  requestHoursAdjustment,
  decideHoursAdjustment,
  createMajorSchedule,
  updateMajorSchedule,
  deleteMajorSchedule,
  listMajorScheduleSubmissions,
  listMajorLabTimeSlots,
  submitMajorSchedule,
  requestMajorScheduleEdit,
  decideMajorScheduleEdit,
  listMajorScheduleEditRequests,
  getMajorScheduleConflicts,
  getMajorScheduleRequirements,
  listMajorScheduleAuditLogs,
  finalizeMajorSchedule,
  reopenFinalizedMajorSchedule,
  respondToInstructorSchedule,
  listInstructorScheduleResponses,
  decideInstructorScheduleResponse,
  assignFloatingInstructor,
  listInstructorScheduleReviews,
  getInstructorScheduleReview,
  listInstructorScheduleReviewHistory,
  setAcceptedSchedules,
  acceptAllInstructorScheduleReviews,
  acceptInstructorScheduleReview,
  suggestInstructorScheduleChange,
  analyzeInstructorSuggestion,
  applyInstructorSuggestion,
  applySuggestionWithAdjustments,
  retainInitialSchedule,
  previewRetention,
  analyzeAdvancedAdjustment,
};
