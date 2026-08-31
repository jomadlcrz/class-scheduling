import { apiGet, apiPost, apiPut } from "~/lib/api";
import type {
  MajorEditRequestAttemptSummary,
  SchedulingWindowName,
  SchedulingWindowState,
  TermAdvanceAction,
  TermAdvanceResult,
  TermDeadlineUpdate,
  TermDepartmentReadiness,
  TermDepartmentSendResult,
  TermDistributionReadiness,
  TermProgramPublishResult,
  TermProgramSendResult,
  TermProgramWithdrawResult,
  TermResponseReadiness,
  TermSchedulingCalendar,
} from "~/types/term-scheduling";

export const termSchedulingService = {
  getCalendar(syId: number, semesterNumber: number): Promise<TermSchedulingCalendar> {
    return apiGet<TermSchedulingCalendar>(`/scheduling-terms/${syId}/${semesterNumber}`);
  },

  getCurrentCalendar(): Promise<TermSchedulingCalendar> {
    return apiGet<TermSchedulingCalendar>("/scheduling-terms/current");
  },

  updateDeadlines(
    syId: number,
    semesterNumber: number,
    payload: {
      majors_due_at?: string | null;
      suggestions_due_at?: string | null;
      suggestion_attempt_limit?: number;
      major_edit_request_limit?: number;
      force?: boolean;
    },
  ): Promise<TermDeadlineUpdate> {
    return apiPut<TermDeadlineUpdate>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/deadlines`,
      {
        majorsDueAt: payload.majors_due_at,
        suggestionsDueAt: payload.suggestions_due_at,
        discardGenerated: payload.force,
      },
    );
  },

  openWindow(
    syId: number,
    semesterNumber: number,
    window: SchedulingWindowName,
    payload: { scheduledClosingAt?: string | null; confirmed?: boolean } = {},
  ): Promise<{ message: string; window: SchedulingWindowState }> {
    return apiPost<{ message: string; window: SchedulingWindowState }>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/windows/${window}/open`,
      payload,
    );
  },

  closeWindow(
    syId: number,
    semesterNumber: number,
    window: SchedulingWindowName,
  ): Promise<{ message: string; window: SchedulingWindowState }> {
    return apiPost<{ message: string; window: SchedulingWindowState }>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/windows/${window}/close`,
      {},
    );
  },

  getDepartmentDistributionReadiness(
    syId: number,
    semesterNumber: number,
  ): Promise<TermDepartmentReadiness> {
    return apiGet<TermDepartmentReadiness>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/department-readiness`,
    );
  },

  getDistributionReadiness(
    syId: number,
    semesterNumber: number,
  ): Promise<TermDistributionReadiness> {
    return apiGet<TermDistributionReadiness>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/readiness`,
    );
  },

  getResponseReadiness(
    syId: number,
    semesterNumber: number,
  ): Promise<TermResponseReadiness> {
    return apiGet<TermResponseReadiness>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/response-readiness`,
    );
  },

  getMajorEditAttempts(
    syId: number,
    semesterNumber: number,
  ): Promise<MajorEditRequestAttemptSummary> {
    return apiGet<MajorEditRequestAttemptSummary>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/major-edit-request-attempts`,
    );
  },

  sendDepartment(
    syId: number,
    semesterNumber: number,
    departmentId: number,
  ): Promise<TermDepartmentSendResult> {
    return apiPost<TermDepartmentSendResult>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/departments/${departmentId}/send`,
      {},
    );
  },

  sendProgram(
    syId: number,
    semesterNumber: number,
    programId: number,
  ): Promise<TermProgramSendResult> {
    return apiPost<TermProgramSendResult>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/programs/${programId}/send`,
      {},
    );
  },

  publishProgram(
    syId: number,
    semesterNumber: number,
    programId: number,
  ): Promise<TermProgramPublishResult> {
    return apiPost<TermProgramPublishResult>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/programs/${programId}/publish`,
      {},
    );
  },

  withdrawProgram(
    syId: number,
    semesterNumber: number,
    programId: number,
  ): Promise<TermProgramWithdrawResult> {
    return apiPost<TermProgramWithdrawResult>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/programs/${programId}/withdraw`,
      {},
    );
  },

  advancePhase(
    syId: number,
    semesterNumber: number,
    action: TermAdvanceAction,
    payload: Record<string, unknown> = {},
  ): Promise<TermAdvanceResult> {
    return apiPost<TermAdvanceResult>(
      `/registrar/scheduling-terms/${syId}/${semesterNumber}/advance`,
      { action },
    );
  },
};
