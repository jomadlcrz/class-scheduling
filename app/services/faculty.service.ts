import { ApiError, apiGet, apiMessage, apiPost } from "~/lib/api";
import type { DepartmentOption } from "~/types/department";
import type { CreateFacultyAccountInput, Faculty } from "~/types/faculty";

/**
 * Faculty service. `create`, `list`, and `listDepartmentOptions` talk to the
 * real API (super_admin + registrar modules).
 */

/** POST /super-admin/create-faculty-accounts — emails temp password. Returns the backend message. */
async function create(input: CreateFacultyAccountInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/super-admin/create-faculty-accounts", {
    departmentId: input.departmentId,
    firstName: input.firstName,
    ...(input.midName && { midName: input.midName }),
    lastName: input.lastName,
    // Omitted enum fields default to "N/A" (NOT_SPECIFIED) on the backend.
    ...(input.gender && { gender: input.gender }),
    ...(input.civilStatus && { civilStatus: input.civilStatus }),
    contact: { mobile: input.mobile, email: input.email },
    roleName: input.roleName,
  });
  return apiMessage(data);
}

/** GET /super-admin/create-faculty-accounts — returns all faculty profiles. 404 → empty. */
async function list(): Promise<Faculty[]> {
  type FacultyResponse = {
    faculty_id: number;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    gender: string;
    civil_status: string;
    department: string;
    mobile: string | null;
    email: string | null;
    has_account: boolean;
    roles: { role_id: number; role_name: string; permissions: unknown[] }[];
  };

  let data: FacultyResponse[];
  try {
    data = await apiGet<FacultyResponse[]>("/super-admin/create-faculty-accounts");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }

  return data.map((f) => {
    const deptParts = f.department.split(" - ");
    return {
      id: f.faculty_id,
      firstName: f.first_name,
      midName: f.mid_name,
      lastName: f.last_name,
      gender: f.gender,
      civilStatus: f.civil_status,
      department: f.department,
      departmentCode: deptParts[0] ?? f.department,
      mobile: f.mobile,
      email: f.email,
      hasAccount: f.has_account,
      roles: (f.roles ?? []).map((r) => ({ id: r.role_id, name: r.role_name })),
    };
  });
}

type DepartmentsResponse = {
  departments: {
    department_id: number;
    department_abbrev: string;
    department_name: string;
  }[];
};

/** GET /departments — real departments for the account form dropdown. */
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

export const facultyService = { create, list, listDepartmentOptions };
