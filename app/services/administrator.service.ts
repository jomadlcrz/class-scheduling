import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type {
  Administrator,
  AdministratorDetail,
  AdministratorRole,
  CreateAdministratorAccountInput,
  UpdateAdministratorInput,
} from "~/types/administrator";

/** Administrator service (Super Admin / Registrar Admin accounts, super_admin module). */

/** POST /super-admin/create-admin-accounts — emails temp password. Returns the backend message. */
async function create(input: CreateAdministratorAccountInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/super-admin/create-admin-accounts", {
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

/** GET /super-admin/create-admin-accounts — returns all Super Admin/Registrar Admin profiles. 404 → empty. */
async function list(): Promise<Administrator[]> {
  type AdminResponse = {
    profile_id: number;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    gender: string;
    civil_status: string;
    department: string | null;
    mobile: string | null;
    email: string | null;
    roles: { role_id: number; role_name: string; permissions: unknown[] }[];
  };

  let data: AdminResponse[];
  try {
    data = await apiGet<AdminResponse[]>("/super-admin/create-admin-accounts");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }

  return data.map((a) => {
    const department = a.department ?? "";
    const deptParts = department.split(" - ");
    return {
      id: a.profile_id,
      firstName: a.first_name,
      midName: a.mid_name,
      lastName: a.last_name,
      gender: a.gender,
      civilStatus: a.civil_status,
      department,
      departmentCode: deptParts[0] ?? department,
      mobile: a.mobile,
      email: a.email,
      roleName: (a.roles[0]?.role_name ?? "Registrar Admin") as AdministratorRole,
    };
  });
}

type AdminDetailResponse = {
  profile_id: number;
  first_name: string;
  mid_name: string | null;
  last_name: string;
  gender: string;
  civil_status: string;
  mobile: string | null;
  email: string | null;
  account_active: boolean | null;
};

/** GET /super-admin/admin-accounts/<id> */
async function get(id: number): Promise<AdministratorDetail> {
  const d = await apiGet<AdminDetailResponse>(`/super-admin/admin-accounts/${id}`);
  return {
    id: d.profile_id,
    firstName: d.first_name,
    midName: d.mid_name,
    lastName: d.last_name,
    gender: d.gender,
    civilStatus: d.civil_status,
    mobile: d.mobile,
    email: d.email,
    accountActive: d.account_active,
  };
}

/** PUT /super-admin/admin-accounts/<id> — edits name/contact fields only. */
async function update(id: number, input: UpdateAdministratorInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/super-admin/admin-accounts/${id}`, input);
  return apiMessage(data);
}

/** DELETE /super-admin/admin-accounts/<id> — deactivates the login, not the profile. */
async function deactivate(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/super-admin/admin-accounts/${id}`);
  return apiMessage(data);
}

/** PATCH /super-admin/admin-accounts/<id>/restore — reactivates the login. */
async function reactivate(id: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/super-admin/admin-accounts/${id}/restore`);
  return apiMessage(data);
}

export const administratorService = { list, create, get, update, deactivate, reactivate };
