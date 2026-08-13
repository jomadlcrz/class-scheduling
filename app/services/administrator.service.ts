import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type {
  AdminAuditResult,
} from "~/types/admin-audit";
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
    profile_photo_url: string | null;
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
      profilePhotoUrl: a.profile_photo_url,
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

/** DELETE /super-admin/admin-accounts/<id> — deactivates the login, not the profile. Reason required. */
async function deactivate(id: number, reason: string): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/super-admin/admin-accounts/${id}`, { reason });
  return apiMessage(data);
}

/** PATCH /super-admin/admin-accounts/<id>/restore — reactivates the login. Reason required. */
async function reactivate(id: number, reason: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/super-admin/admin-accounts/${id}/restore`, { reason });
  return apiMessage(data);
}


type AuditApiEntry = {
  id: number;
  occurred_at: string | null;
  occurred_at_display: string | null;
  action: string;
  action_label: string;
  account: { user_id: number; email: string | null; display: string | null };
  performed_by: { user_id: number; email: string | null; display: string | null } | null;
  reason: string | null;
};

type AuditApiResponse = {
  items: AuditApiEntry[];
  pagination: { page: number; per_page: number; total: number; pages: number };
};

/** GET /super-admin/audit-log — account deactivation/reactivation audit trail. */
async function listAuditLog(page: number, perPage: number): Promise<AdminAuditResult> {
  const query = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const data = await apiGet<AuditApiResponse>(`/super-admin/audit-log?${query}`);
  return {
    items: data.items.map((i) => ({
      id: i.id,
      occurredAt: i.occurred_at,
      occurredAtDisplay: i.occurred_at_display,
      action: i.action,
      actionLabel: i.action_label,
      account: {
        userId: i.account.user_id,
        email: i.account.email,
        display: i.account.display,
      },
      performedBy: i.performed_by
        ? {
            userId: i.performed_by.user_id,
            email: i.performed_by.email,
            display: i.performed_by.display,
          }
        : null,
      reason: i.reason,
    })),
    page: data.pagination.page,
    perPage: data.pagination.per_page,
    total: data.pagination.total,
    pages: data.pagination.pages,
  };
}

export type SystemAccount = {
  userId: number;
  email: string | null;
  roles: string[];
  active: boolean;
  pendingFirstLogin: boolean;
  deactivatedAt: string | null;
};

/** GET /super-admin/accounts — every login across every role. */
async function listAccounts(): Promise<{ items: SystemAccount[]; counts: { active: number; deactivated: number; total: number; pendingFirstLogin: number } }> {
  type Row = { user_id: number; email: string | null; roles: string[]; pending_first_login?: boolean; deactivated_at?: string | null };
  const data = await apiGet<{
    active: Row[];
    deactivated: Row[];
    counts: { active: number; deactivated: number; total: number; pending_first_login: number };
  }>("/super-admin/accounts");
  return {
    items: [
      ...data.active.map((row) => ({ userId: row.user_id, email: row.email, roles: row.roles, active: true, pendingFirstLogin: Boolean(row.pending_first_login), deactivatedAt: null })),
      ...data.deactivated.map((row) => ({ userId: row.user_id, email: row.email, roles: row.roles, active: false, pendingFirstLogin: false, deactivatedAt: row.deactivated_at ?? null })),
    ],
    counts: { ...data.counts, pendingFirstLogin: data.counts.pending_first_login },
  };
}

export const administratorService = {
  list,
  create,
  get,
  update,
  deactivate,
  reactivate,
  listAuditLog,
  listAccounts,
};
