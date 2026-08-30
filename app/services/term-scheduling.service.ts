import { apiGet, apiPatch, apiPost } from "~/lib/api";
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
    return apiPatch<TermDeadlineUpdate>(
      `/scheduling-terms/${syId}/${semesterNumber}/deadlines`,
      payload,
    );
  },

  openWindow(
    syId: number,
    semesterNumber: number,
    window: SchedulingWindowName,
    payload: { scheduledClosingAt?: string | null; force?: boolean } = {},
  ): Promise<{ message: string; window: SchedulingWindowState }> {
    return apiPost<{ message: string; window: SchedulingWindowState }>(
      `/scheduling-terms/${syId}/${semesterNumber}/windows/${window}/open`,
      payload,
    );
  },

  closeWindow(
    syId: number,
    semesterNumber: number,
    window: SchedulingWindowName,
  ): Promise<{ message: string; window: SchedulingWindowState }> {
    return apiPost<{ message: string; window: SchedulingWindowState }>(
      `/scheduling-terms/${syId}/${semesterNumber}/windows/${window}/close`,
      {},
    );
  },

  getDepartmentDistributionReadiness(
    syId: number,
    semesterNumber: number,
  ): Promise<TermDepartmentReadiness> {
    return apiGet<TermDepartmentReadiness>(
      `/scheduling-terms/${syId}/${semesterNumber}/distribution-readiness`,
    );
  },

  getDistributionReadiness(
    syId: number,
    semesterNumber: number,
  ): Promise<TermDistributionReadiness> {
    return apiGet<TermDistributionReadiness>(
      `/scheduling-terms/${syId}/${semesterNumber}/distribution-readiness`,
    );
  },

  getResponseReadiness(
    syId: number,
    semesterNumber: number,
  ): Promise<TermResponseReadiness> {
    return apiGet<TermResponseReadiness>(
      `/scheduling-terms/${syId}/${semesterNumber}/response-readiness`,
    );
  },

  getMajorEditAttempts(
    syId: number,
    semesterNumber: number,
  ): Promise<MajorEditRequestAttemptSummary> {
    return apiGet<MajorEditRequestAttemptSummary>(
      `/scheduling-terms/${syId}/${semesterNumber}/major-edit-attempts`,
    );
  },

  sendDepartment(
    syId: number,
    semesterNumber: number,
    departmentId: number,
  ): Promise<TermDepartmentSendResult> {
    return apiPost<TermDepartmentSendResult>(
      `/scheduling-terms/${syId}/${semesterNumber}/departments/${departmentId}/send`,
      {},
    );
  },

  sendProgram(
    syId: number,
    semesterNumber: number,
    programId: number,
  ): Promise<TermProgramSendResult> {
    return apiPost<TermProgramSendResult>(
      `/scheduling-terms/${syId}/${semesterNumber}/programs/${programId}/send`,
      {},
    );
  },

  publishProgram(
    syId: number,
    semesterNumber: number,
    programId: number,
  ): Promise<TermProgramPublishResult> {
    return apiPost<TermProgramPublishResult>(
      `/scheduling-terms/${syId}/${semesterNumber}/programs/${programId}/publish`,
      {},
    );
  },

  withdrawProgram(
    syId: number,
    semesterNumber: number,
    programId: number,
  ): Promise<TermProgramWithdrawResult> {
    return apiPost<TermProgramWithdrawResult>(
      `/scheduling-terms/${syId}/${semesterNumber}/programs/${programId}/withdraw`,
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
      `/scheduling-terms/${syId}/${semesterNumber}/advance`,
      { action, ...payload },
    );
  },
};
