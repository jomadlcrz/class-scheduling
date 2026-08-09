import { apiGet } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type { SuperAdminAnalytics } from "~/types/super-admin-analytics";

/** The term-scoped self-analytics payload (student / faculty) is an unknown
 * shape on purpose — only the super-admin snapshot is strongly typed. */
export type SelfAnalytics = Record<string, unknown>;

/** GET /super-admin/analytics — system-wide account and RBAC snapshot. */
async function getAdmin(): Promise<SuperAdminAnalytics> {
  return apiGet<SuperAdminAnalytics>("/super-admin/analytics");
}

/** GET /students/me/analytics — current student's term-scoped summary. */
async function getStudent(syId: number, semesterNumber: number): Promise<SelfAnalytics> {
  return apiGet<SelfAnalytics>(`/students/me/analytics${termScopeQuery(syId, semesterNumber)}`);
}

/** GET /instructor/analytics — current faculty member's term-scoped summary. */
async function getFaculty(syId: number, semesterNumber: number): Promise<SelfAnalytics> {
  return apiGet<SelfAnalytics>(`/instructor/analytics${termScopeQuery(syId, semesterNumber)}`);
}

export const selfAnalyticsService = { getAdmin, getStudent, getFaculty };
