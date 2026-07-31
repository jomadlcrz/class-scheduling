import { apiGet } from "~/lib/api";
import type { RegistrarAnalyticsResponse } from "~/types/registrar-analytics";

/** GET /registrar/analytics — the school-wide "is this term ready" picture. */
async function getAnalytics(syId: number, semId: number): Promise<RegistrarAnalyticsResponse> {
  return apiGet<RegistrarAnalyticsResponse>(`/registrar/analytics?sy_id=${syId}&sem_id=${semId}`);
}

export const registrarService = {
  getAnalytics,
};
