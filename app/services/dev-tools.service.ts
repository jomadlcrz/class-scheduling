import { apiMessage, apiPost } from "~/lib/api";

/** Dev Tools Reset & Database Maintenance endpoints (Requires { confirm: "RESET" }). */

async function resetAll(confirm: string = "RESET"): Promise<string> {
  const data = await apiPost<{ message?: string }>("/dev-tools/reset/all", { confirm });
  return apiMessage(data);
}

async function resetAudits(confirm: string = "RESET"): Promise<string> {
  const data = await apiPost<{ message?: string }>("/dev-tools/reset/audits", { confirm });
  return apiMessage(data);
}

async function resetInstructorAssignments(confirm: string = "RESET"): Promise<string> {
  const data = await apiPost<{ message?: string }>("/dev-tools/reset/instructor-assignments", { confirm });
  return apiMessage(data);
}

async function resetPrograms(confirm: string = "RESET"): Promise<string> {
  const data = await apiPost<{ message?: string }>("/dev-tools/reset/programs", { confirm });
  return apiMessage(data);
}

async function resetScheduleTallies(confirm: string = "RESET"): Promise<string> {
  const data = await apiPost<{ message?: string }>("/dev-tools/reset/schedule-tallies", { confirm });
  return apiMessage(data);
}

async function resetSchedules(confirm: string = "RESET"): Promise<string> {
  const data = await apiPost<{ message?: string }>("/dev-tools/reset/schedules", { confirm });
  return apiMessage(data);
}

async function resetSections(confirm: string = "RESET"): Promise<string> {
  const data = await apiPost<{ message?: string }>("/dev-tools/reset/sections", { confirm });
  return apiMessage(data);
}

async function resetStudents(confirm: string = "RESET"): Promise<string> {
  const data = await apiPost<{ message?: string }>("/dev-tools/reset/students", { confirm });
  return apiMessage(data);
}

async function resetUsers(confirm: string = "RESET"): Promise<string> {
  const data = await apiPost<{ message?: string }>("/dev-tools/reset/users", { confirm });
  return apiMessage(data);
}

export const devToolsService = {
  resetAll,
  resetAudits,
  resetInstructorAssignments,
  resetPrograms,
  resetScheduleTallies,
  resetSchedules,
  resetSections,
  resetStudents,
  resetUsers,
};
