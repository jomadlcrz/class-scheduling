import { apiGet, apiPatch, apiPost, apiPut } from "~/lib/api";
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
      `/instructors/schedule-reviews/${releaseId}/accept`,
    );
  },

  acceptAllInstructorReviews(
    syId: number,
    semesterNumber: number,
  ): Promise<InstructorReviewActionResult> {
    return apiPost<InstructorReviewActionResult>(
      "/instructors/schedule-reviews/accept-all",
      { syId, semesterNumber },
    );
  },

  suggestInstructorChange(
    releaseId: number,
    payload: InstructorSuggestPayload,
  ): Promise<InstructorReviewActionResult> {
    return apiPost<InstructorReviewActionResult>(
      `/instructors/schedule-reviews/${releaseId}/suggest`,
      payload,
    );
  },

  getDeanProgress(releaseId: number): Promise<DeanReviewProgress> {
    return apiGet<DeanReviewProgress>(`/dean/schedule-reviews/${releaseId}/progress`);
  },

  deanAccept(responseId: number, remarks?: string): Promise<{ message: string }> {
    return apiPost<{ message: string }>(`/dean/schedule-reviews/responses/${responseId}/accept`, {
      remarks: remarks || undefined,
    });
  },

  deanForward(
    responseId: number,
    remarks?: string,
  ): Promise<{ message: string; warnings?: string[] }> {
    return apiPost<{ message: string; warnings?: string[] }>(
      `/dean/schedule-reviews/responses/${responseId}/forward`,
      { remarks: remarks || undefined },
    );
  },

  deanReject(responseId: number, remarks: string): Promise<{ message: string }> {
    return apiPost<{ message: string }>(`/dean/schedule-reviews/responses/${responseId}/reject`, {
      remarks,
    });
  },

  analyzeDeanSuggestion(responseId: number): Promise<SuggestionAnalysisResult> {
    return apiGet<SuggestionAnalysisResult>(
      `/dean/schedule-reviews/responses/${responseId}/analyze`,
    );
  },

  getRegistrarWorkspace(releaseId: number): Promise<RegistrarRevisionWorkspace> {
    return apiGet<RegistrarRevisionWorkspace>(
      `/registrar/schedule-reviews/${releaseId}/workspace`,
    );
  },

  analyzeRegistrarSuggestion(responseId: number): Promise<SuggestionAnalysisResult> {
    return apiGet<SuggestionAnalysisResult>(
      `/registrar/schedule-reviews/suggestions/${responseId}/analyze`,
    );
  },

  applyRegistrarSuggestion(
    responseId: number,
    payload?: { remarks?: string },
  ): Promise<{ message: string }> {
    return apiPost<{ message: string }>(
      `/registrar/schedule-reviews/suggestions/${responseId}/apply`,
      payload ?? {},
    );
  },

  rejectRegistrarSuggestion(
    responseId: number,
    remarks: string,
  ): Promise<{ message: string }> {
    return apiPost<{ message: string }>(
      `/registrar/schedule-reviews/suggestions/${responseId}/reject`,
      { remarks },
    );
  },

  analyzeAdvancedSuggestion(responseId: number): Promise<AdvancedAnalysisResult> {
    return apiGet<AdvancedAnalysisResult>(
      `/registrar/schedule-reviews/suggestions/${responseId}/analyze-advanced`,
    );
  },

  previewRetentionDecision(
    responseId: number,
    reasonCategory: string,
  ): Promise<RetentionDecisionPreview> {
    const q = new URLSearchParams({ reasonCategory });
    return apiGet<RetentionDecisionPreview>(
      `/registrar/schedule-reviews/suggestions/${responseId}/retention-preview?${q.toString()}`,
    );
  },

  applyAdvancedSuggestion(
    responseId: number,
    payload: { analysisToken: string; remarks?: string; allowRelocations?: boolean },
  ): Promise<{ message: string; relocatedCount?: number }> {
    return apiPost<{ message: string; relocatedCount?: number }>(
      `/registrar/schedule-reviews/suggestions/${responseId}/apply-advanced`,
      payload,
    );
  },

  recordDirectDeanAction(
    responseId: number,
    payload: { action: "accept" | "reject"; remarks: string; scheduleOverrides?: unknown },
  ): Promise<{ message: string }> {
    return apiPatch<{ message: string }>(
      `/dean/schedule-reviews/responses/${responseId}`,
      payload,
    );
  },
};
