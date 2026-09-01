import { apiGet, apiPost, apiPut } from "~/lib/api";
import type {
  AdvancedAnalysisResult,
  DeanReviewProgress,
  InstructorReviewActionResult,
  InstructorReviewDetail,
  InstructorReviewSummary,
  InstructorSuggestPayload,
  RegistrarRevisionWorkspace,
  RetentionDecisionPreview,
  SuggestionAnalysisResult,
} from "~/types/instructor-review";

export const instructorReviewService = {
  async listInstructorReviews(): Promise<InstructorReviewSummary[]> {
    const data = await apiGet<{ reviews?: InstructorReviewSummary[] } | InstructorReviewSummary[]>(
      "/instructors/schedule-reviews",
    );
    if (Array.isArray(data)) return data;
    return data.reviews ?? [];
  },

  async listInstructorReviewHistory(): Promise<InstructorReviewDetail[]> {
    const data = await apiGet<{ requests?: InstructorReviewDetail[] } | InstructorReviewDetail[]>(
      "/instructors/schedule-reviews/history",
    );
    if (Array.isArray(data)) return data;
    return data.requests ?? [];
  },

  getInstructorReviewDetail(releaseId: number): Promise<InstructorReviewDetail> {
    return apiGet<InstructorReviewDetail>(`/instructors/schedule-reviews/${releaseId}`);
  },

  setAcceptedSchedules(
    releaseId: number,
    scheduleIds: number[],
    accepted: boolean,
  ): Promise<InstructorReviewActionResult> {
    return apiPut<InstructorReviewActionResult>(
      `/instructors/schedule-reviews/${releaseId}/accepted-schedules`,
      { scheduleIds, accepted },
    );
  },

  acceptInstructorReview(releaseId: number): Promise<InstructorReviewActionResult> {
    return apiPost<InstructorReviewActionResult>(
      `/instructors/schedule-reviews/${releaseId}/acceptances`,
    );
  },

  acceptAllInstructorReviews(
    syId: number,
    semesterNumber: number,
  ): Promise<InstructorReviewActionResult> {
    return apiPost<InstructorReviewActionResult>(
      "/instructors/schedule-reviews/bulk-acceptances",
      { syId, semesterNumber },
    );
  },

  suggestInstructorChange(
    releaseId: number,
    payload: InstructorSuggestPayload,
  ): Promise<InstructorReviewActionResult> {
    return apiPost<InstructorReviewActionResult>(
      `/instructors/schedule-reviews/${releaseId}/suggestions`,
      payload,
    );
  },

  getDeanProgress(releaseId: number): Promise<DeanReviewProgress> {
    return apiGet<DeanReviewProgress>(`/deans/schedule-approvals/${releaseId}/review-progress`);
  },

  deanAccept(responseId: number, remarks?: string): Promise<{ message: string }> {
    return apiPost<{ message: string }>(
      `/deans/instructor-schedule-responses/${responseId}/decisions`,
      { approve: true, note: remarks || undefined },
    );
  },

  deanForward(
    responseId: number,
    remarks?: string,
  ): Promise<{ message: string; warnings?: string[] }> {
    return apiPost<{ message: string; warnings?: string[] }>(
      `/deans/instructor-schedule-responses/${responseId}/decisions`,
      { approve: true, note: remarks || undefined },
    );
  },

  deanReject(responseId: number, remarks: string): Promise<{ message: string }> {
    return apiPost<{ message: string }>(
      `/deans/instructor-schedule-responses/${responseId}/decisions`,
      { approve: false, note: remarks },
    );
  },

  analyzeDeanSuggestion(responseId: number): Promise<SuggestionAnalysisResult> {
    return apiPost<SuggestionAnalysisResult>(
      `/registrar/instructor-schedule-responses/${responseId}/analyze`,
    );
  },

  getRegistrarWorkspace(releaseId: number): Promise<RegistrarRevisionWorkspace> {
    return apiGet<RegistrarRevisionWorkspace>(
      `/registrar/schedule-releases/${releaseId}/revision-workspace`,
    );
  },

  analyzeRegistrarSuggestion(responseId: number): Promise<SuggestionAnalysisResult> {
    return apiPost<SuggestionAnalysisResult>(
      `/registrar/instructor-schedule-responses/${responseId}/analyze`,
    );
  },

  applyRegistrarSuggestion(
    responseId: number,
    payload?: { remarks?: string },
  ): Promise<{ message: string }> {
    return apiPost<{ message: string }>(
      `/registrar/instructor-schedule-responses/${responseId}/apply`,
      payload?.remarks ? { note: payload.remarks } : {},
    );
  },

  rejectRegistrarSuggestion(
    responseId: number,
    remarks: string,
  ): Promise<{ message: string }> {
    return apiPost<{ message: string }>(
      `/registrar/instructor-schedule-responses/${responseId}/retain`,
      { note: remarks },
    );
  },

  analyzeAdvancedSuggestion(responseId: number): Promise<AdvancedAnalysisResult> {
    return apiPost<AdvancedAnalysisResult>(
      `/registrar/instructor-schedule-responses/${responseId}/analyze-advanced`,
    );
  },

  previewRetentionDecision(
    responseId: number,
    reasonCategory: string,
  ): Promise<RetentionDecisionPreview> {
    return apiPost<RetentionDecisionPreview>(
      `/registrar/instructor-schedule-responses/${responseId}/retention-preview`,
      { reasonCategory },
    );
  },

  applyAdvancedSuggestion(
    responseId: number,
    payload: { analysisToken: string; remarks?: string; allowRelocations?: boolean },
  ): Promise<{ message: string; relocatedCount?: number }> {
    return apiPost<{ message: string; relocatedCount?: number }>(
      `/registrar/instructor-schedule-responses/${responseId}/apply-with-adjustments`,
      { note: payload.remarks || undefined },
    );
  },

  recordDirectDeanAction(
    responseId: number,
    payload: { action: "accept" | "reject"; remarks: string; scheduleOverrides?: unknown },
  ): Promise<{ message: string }> {
    return apiPost<{ message: string }>(
      `/deans/instructor-schedule-responses/${responseId}/decisions`,
      { approve: payload.action === "accept", note: payload.remarks },
    );
  },
};
