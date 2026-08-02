import { apiGet } from "~/lib/api";

export type SelfAnalytics = Record<string, unknown>;

function termQuery(syId: number, semId: number) {
  return `?sy_id=${syId}&sem_id=${semId}`;
}

/** GET /super-admin/analytics — system-wide account and RBAC snapshot. */
async function getAdmin(): Promise<SelfAnalytics> {
  return apiGet<SelfAnalytics>("/super-admin/analytics");
}

/** GET /students/me/analytics — current student's term-scoped summary. */
async function getStudent(syId: number, semId: number): Promise<SelfAnalytics> {
  return apiGet<SelfAnalytics>(`/students/me/analytics${termQuery(syId, semId)}`);
}

/** GET /instructor/analytics — current faculty member's term-scoped summary. */
async function getFaculty(syId: number, semId: number): Promise<SelfAnalytics> {
  return apiGet<SelfAnalytics>(`/instructor/analytics${termQuery(syId, semId)}`);
}

export const selfAnalyticsService = { getAdmin, getStudent, getFaculty };
