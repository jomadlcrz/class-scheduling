import { apiGet } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type { RegistrarAnalyticsResponse } from "~/types/registrar-analytics";

/** GET /registrar/analytics — the school-wide "is this term ready" picture. */
async function getAnalytics(syId: number, semesterNumber: number): Promise<RegistrarAnalyticsResponse> {
  return apiGet<RegistrarAnalyticsResponse>(`/registrar/analytics${termScopeQuery(syId, semesterNumber)}`);
}

export const registrarService = {
  getAnalytics,
};
