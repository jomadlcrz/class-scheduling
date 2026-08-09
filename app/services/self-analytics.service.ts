import { apiGet } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type { InstructorAnalytics } from "~/types/instructor-analytics";
import type { StudentAnalytics } from "~/types/student-analytics";
import type { SuperAdminAnalytics } from "~/types/super-admin-analytics";

/** GET /super-admin/analytics — system-wide account and RBAC snapshot. */
async function getAdmin(): Promise<SuperAdminAnalytics> {
  return apiGet<SuperAdminAnalytics>("/super-admin/analytics");
}

/** GET /students/me/analytics — current student's term-scoped schedule. */
async function getStudent(syId: number, semesterNumber: number): Promise<StudentAnalytics> {
  return apiGet<StudentAnalytics>(`/students/me/analytics${termScopeQuery(syId, semesterNumber)}`);
}

/** GET /instructor/analytics — current faculty member's term-scoped load. */
async function getFaculty(syId: number, semesterNumber: number): Promise<InstructorAnalytics> {
  return apiGet<InstructorAnalytics>(`/instructor/analytics${termScopeQuery(syId, semesterNumber)}`);
}

export const selfAnalyticsService = { getAdmin, getStudent, getFaculty };
