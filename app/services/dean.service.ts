import { facultyService } from "~/services/faculty.service";
import type { CreateFacultyAccountInput, Faculty } from "~/types/faculty";

/**
 * Deans have no dedicated backend endpoint — they're Faculty accounts
 * (POST/GET /super-admin/create-faculty-accounts) filtered/created with
 * roleName "Dean". See faculty.service.ts for the real API calls.
 */

async function list(): Promise<Faculty[]> {
  const faculty = await facultyService.list();
  return faculty.filter((f) => f.roles.some((r) => r.name === "Dean"));
}

async function create(input: Omit<CreateFacultyAccountInput, "roleName">): Promise<string> {
  return facultyService.create({ ...input, roleName: "Dean" });
}

export const deanService = { list, create };
