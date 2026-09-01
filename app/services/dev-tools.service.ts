import { apiDelete, apiMessage } from "~/lib/api";

/** Dev Tools Reset & Database Maintenance endpoints (Requires { confirm: "RESET" }). */

async function resetAll(confirm: string = "RESET"): Promise<string> {
  const data = await apiDelete<{ message?: string }>("/dev-tools/data", { confirm });
  return apiMessage(data);
}

async function resetAudits(confirm: string = "RESET"): Promise<string> {
  const data = await apiDelete<{ message?: string }>("/dev-tools/data/audits", { confirm });
  return apiMessage(data);
}

async function resetInstructorAssignments(confirm: string = "RESET"): Promise<string> {
  const data = await apiDelete<{ message?: string }>("/dev-tools/data/instructor-assignments", { confirm });
  return apiMessage(data);
}

async function resetPrograms(confirm: string = "RESET"): Promise<string> {
  const data = await apiDelete<{ message?: string }>("/dev-tools/data/programs", { confirm });
  return apiMessage(data);
}

async function resetScheduleTallies(confirm: string = "RESET"): Promise<string> {
  const data = await apiDelete<{ message?: string }>("/dev-tools/data/schedule-tallies", { confirm });
  return apiMessage(data);
}

async function resetSchedulingWorkflow(confirm: string = "RESET"): Promise<string> {
  const data = await apiDelete<{ message?: string }>("/dev-tools/data/scheduling-workflow", { confirm });
  return apiMessage(data);
}

async function resetSchedules(confirm: string = "RESET"): Promise<string> {
  const data = await apiDelete<{ message?: string }>("/dev-tools/data/schedules", { confirm });
  return apiMessage(data);
}

async function resetSections(confirm: string = "RESET"): Promise<string> {
  const data = await apiDelete<{ message?: string }>("/dev-tools/data/sections", { confirm });
  return apiMessage(data);
}

async function resetStudents(confirm: string = "RESET"): Promise<string> {
  const data = await apiDelete<{ message?: string }>("/dev-tools/data/students", { confirm });
  return apiMessage(data);
}

async function resetUsers(confirm: string = "RESET"): Promise<string> {
  const data = await apiDelete<{ message?: string }>("/dev-tools/data/users", { confirm });
  return apiMessage(data);
}

export const devToolsService = {
  resetAll,
  resetAudits,
  resetInstructorAssignments,
  resetPrograms,
  resetScheduleTallies,
  resetSchedulingWorkflow,
  resetSchedules,
  resetSections,
  resetStudents,
  resetUsers,
};
