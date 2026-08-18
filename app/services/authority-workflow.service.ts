import { apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type {
  AssignmentAuditLog,
  HoursAdjustmentRequest,
  InstructorScheduleResponse,
  MajorSchedule,
  MajorScheduleConflict,
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

async function createMajorSchedule(input: MajorScheduleMeetingInput) {
  const data = await apiPost<MessageResponse & { schedule: MajorSchedule }>("/deans/major-schedules", input);
  return { message: apiMessage(data), schedule: data.schedule };
}

async function updateMajorSchedule(id: number, input: MajorScheduleMeetingInput, audience: "dean" | "registrar") {
  const data = await apiPut<MessageResponse & { schedule: MajorSchedule }>(`/${audience}/major-schedules/${id}`, input);
  return { message: apiMessage(data), schedule: data.schedule };
}

async function deleteMajorSchedule(id: number): Promise<string> {
  return apiMessage(await apiDelete<MessageResponse>(`/deans/major-schedules/${id}`));
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
  const data = await apiGet<{ submissions: MajorScheduleSubmission[] }>(`/major-schedule-submissions${query.size ? `?${query}` : ""}`);
  return data.submissions ?? [];
}

async function getMajorScheduleSubmission(submissionId: number): Promise<MajorScheduleSubmission> {
  const data = await apiGet<MajorScheduleSubmission | { submission: MajorScheduleSubmission }>(
    `/major-schedule-submissions/${submissionId}`,
  );
  return "submission" in data ? data.submission : data;
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
  return apiGet<{ conflicts: MajorScheduleConflict[]; conflictCount: number }>(`/registrar/major-schedule-submissions/${submissionId}/conflicts`);
}

async function finalizeMajorSchedule(submissionId: number) {
  const data = await apiPost<MessageResponse & { submission: { id: number; status: string } }>(`/registrar/major-schedule-submissions/${submissionId}/finalize`);
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

export const authorityWorkflowService = {
  listAssignmentAuditLogs,
  listHoursAdjustmentRequests,
  requestHoursAdjustment,
  decideHoursAdjustment,
  createMajorSchedule,
  updateMajorSchedule,
  deleteMajorSchedule,
  listMajorScheduleSubmissions,
  getMajorScheduleSubmission,
  listMajorLabTimeSlots,
  submitMajorSchedule,
  requestMajorScheduleEdit,
  decideMajorScheduleEdit,
  listMajorScheduleEditRequests,
  getMajorScheduleConflicts,
  finalizeMajorSchedule,
  respondToInstructorSchedule,
  listInstructorScheduleResponses,
  decideInstructorScheduleResponse,
  assignFloatingInstructor,
};
