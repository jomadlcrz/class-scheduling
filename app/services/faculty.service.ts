import { ApiError, apiGet, apiPost } from "~/lib/api";
import type { DepartmentOption } from "~/types/department";
import type {
  CreateFacultyAccountInput,
  Faculty,
  FacultyStatus,
  UpdateFacultyInput,
} from "~/types/faculty";
import { faculty, delay } from "~/services/mock-data";

/**
 * Faculty service. `create` and `listDepartmentOptions` talk to the real
 * backend (super_admin + registrar modules); list/update/setStatus are still
 * mocked, so newly created accounts won't appear in the table yet.
 */

function findFaculty(id: string): Faculty {
  const f = faculty.find((f) => f.id === id);
  if (!f) throw new Error("Faculty not found.");
  return f;
}

function emailTaken(email: string, excludeId?: string): boolean {
  return faculty.some(
    (f) => f.id !== excludeId && f.email.toLowerCase() === email.trim().toLowerCase(),
  );
}

async function list(): Promise<Faculty[]> {
  await delay();
  return [...faculty];
}

/** The backend creates the account, emails a temp password, and returns only a message. */
async function create(input: CreateFacultyAccountInput): Promise<void> {
  await apiPost("/super-admin/create-faculty-accounts", {
    departmentId: input.departmentId,
    firstName: input.firstName,
    ...(input.midName && { midName: input.midName }),
    lastName: input.lastName,
    // Omitted enum fields default to "N/A" (NOT_SPECIFIED) on the backend.
    ...(input.gender && { gender: input.gender }),
    ...(input.civilStatus && { civilStatus: input.civilStatus }),
    contact: { mobile: input.mobile, email: input.email },
    roleName: "Faculty",
  });
}

type DepartmentsResponse = {
  departments: {
    department_id: number;
    department_abbrev: string;
    department_name: string;
  }[];
};

/** Real backend departments for the account form's dropdown (integer ids). */
async function listDepartmentOptions(): Promise<DepartmentOption[]> {
  let data: DepartmentsResponse;
  try {
    data = await apiGet<DepartmentsResponse>("/departments");
  } catch (err) {
    // The backend answers an empty departments table with 404.
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.departments.map((d) => ({
    id: d.department_id,
    code: d.department_abbrev,
    name: d.department_name,
  }));
}

async function update(id: string, input: UpdateFacultyInput): Promise<Faculty> {
  await delay();
  const member = findFaculty(id);
  if (input.email && emailTaken(input.email, id))
    throw new Error(`Email "${input.email}" is already in use.`);
  Object.assign(member, input);
  return member;
}

async function setStatus(id: string, status: FacultyStatus): Promise<Faculty> {
  await delay();
  const member = findFaculty(id);
  member.status = status;
  return member;
}

export const facultyService = { list, create, update, setStatus, listDepartmentOptions };
