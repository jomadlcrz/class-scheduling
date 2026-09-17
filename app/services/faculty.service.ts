import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type { DepartmentOption } from "~/types/department";
import type { CreateFacultyAccountInput, Faculty, FacultyDetail, UpdateFacultyInput } from "~/types/faculty";
import type { StudentAddress } from "~/types/student";

/**
 * Faculty service. `create`, `list`, and `listDepartmentOptions` talk to the
 * real API (super_admin + registrar modules).
 */

/** POST /super-admin/faculty-accounts — emails temp password. Returns the backend message. */
async function create(input: CreateFacultyAccountInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/super-admin/faculty-accounts", {
    departmentId: input.departmentId,
    firstName: input.firstName,
    ...(input.midName && { midName: input.midName }),
    lastName: input.lastName,
    // Omitted enum fields default to "N/A" (NOT_SPECIFIED) on the backend.
    ...(input.gender && { gender: input.gender }),
    ...(input.civilStatus && { civilStatus: input.civilStatus }),
    ...(input.employmentStatus && { employmentStatus: input.employmentStatus }),
    ...(input.prefixHonorific && { prefixHonorific: input.prefixHonorific }),
    ...(input.academicRank && { academicRank: input.academicRank }),
    ...(input.address && { address: input.address }),
    contact: { mobile: input.mobile, email: input.email },
    roleName: input.roleName,
  });
  return apiMessage(data);
}

/** GET /super-admin/faculty-accounts — returns all faculty profiles. 404 → empty. */
async function list(): Promise<Faculty[]> {
  type FacultyResponse = {
    faculty_id: number;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    gender: string;
    civil_status: string;
    employment_status?: string;
    prefix_honorific?: string;
    academic_rank?: string | null;
    department: string;
    mobile: string | null;
    email: string | null;
    has_account: boolean;
    account_active?: boolean | null;
    profile_photo_url: string | null;
    roles: { role_id: number; role_name: string; permissions: unknown[] }[];
  };

  let data: FacultyResponse[];
  try {
    data = await apiGet<FacultyResponse[]>("/super-admin/faculty-accounts");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }

  return data.map((f) => {
    const deptParts = f.department.split(" - ");
    const accountActive =
      typeof f.account_active === "boolean"
        ? f.account_active
        : f.has_account
          ? true
          : null;
    return {
      id: f.faculty_id,
      firstName: f.first_name,
      midName: f.mid_name,
      lastName: f.last_name,
      gender: f.gender,
      civilStatus: f.civil_status,
      employmentStatus: f.employment_status ?? "N/A",
      prefixHonorific: f.prefix_honorific ?? "N/A",
      academicRank: f.academic_rank ?? null,
      department: f.department,
      departmentCode: deptParts[0] ?? f.department,
      mobile: f.mobile,
      email: f.email,
      hasAccount: f.has_account,
      accountActive,
      profilePhotoUrl: f.profile_photo_url,
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

/** GET /departments/academic — only departments that can own faculty accounts. */
async function listDepartmentOptions(): Promise<DepartmentOption[]> {
  let data: DepartmentsResponse;
  try {
    data = await apiGet<DepartmentsResponse>("/departments/academic");
  } catch (err) {
    // The backend answers an empty departments table with 404.
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.departments.map((d) => ({
    id: d.department_id,
    abbrev: d.department_abbrev,
    name: d.department_name,
  }));
}

type FacultyDetailResponse = {
  faculty_id: number;
  first_name: string;
  mid_name: string | null;
  last_name: string;
  gender: string;
  civil_status: string;
  employment_status?: string;
  prefix_honorific?: string;
  academic_rank?: string | null;
  department_id?: number;
  employee_id?: string | null;
  mobile: string | null;
  email: string | null;
  account_active: boolean | null;
  address?: StudentAddress | null;
};

/** GET /super-admin/faculty-accounts/<id> */
async function get(id: number): Promise<FacultyDetail> {
  const d = await apiGet<FacultyDetailResponse>(`/super-admin/faculty-accounts/${id}`);
  return {
    id: d.faculty_id,
    firstName: d.first_name,
    midName: d.mid_name,
    lastName: d.last_name,
    gender: d.gender,
    civilStatus: d.civil_status,
    employmentStatus: d.employment_status ?? "N/A",
    prefixHonorific: d.prefix_honorific ?? "N/A",
    academicRank: d.academic_rank ?? null,
    departmentId: d.department_id,
    employeeId: d.employee_id,
    mobile: d.mobile,
    email: d.email,
    accountActive: d.account_active,
    address: d.address ?? null,
  };
}

/** PUT /super-admin/faculty-accounts/<id> */
async function update(id: number, input: UpdateFacultyInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/super-admin/faculty-accounts/${id}`, input);
  return apiMessage(data);
}

/** DELETE /super-admin/faculty-accounts/<id> — deactivates the login, not the profile. Reason required. */
async function deactivate(id: number, reason: string): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/super-admin/faculty-accounts/${id}`, { reason });
  return apiMessage(data);
}

/** PATCH /super-admin/faculty-accounts/<id>/restore — reactivates the login. Reason required. */
async function reactivate(id: number, reason: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/super-admin/faculty-accounts/${id}/restore`, { reason });
  return apiMessage(data);
}

export const facultyService = { create, list, listDepartmentOptions, get, update, deactivate, reactivate };
