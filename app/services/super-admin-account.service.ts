import { apiGet } from "~/lib/api";

export type SuperAdminAccountStatus = "active" | "deactivated";

export type SuperAdminAccount = {
  userId: number;
  email: string;
  roles: string[];
  pendingFirstLogin?: boolean;
  deactivatedAt?: string | null;
};

export type SuperAdminAccountBrowse = {
  active: SuperAdminAccount[];
  deactivated: SuperAdminAccount[];
  counts: { active: number; deactivated: number; total: number; pendingFirstLogin: number };
};

type ApiAccount = {
  user_id: number;
  email: string;
  roles: string[];
  pending_first_login?: boolean;
  deactivated_at?: string | null;
};

function mapAccount(row: ApiAccount): SuperAdminAccount {
  return {
    userId: row.user_id,
    email: row.email,
    roles: row.roles,
    ...(row.pending_first_login !== undefined && { pendingFirstLogin: row.pending_first_login }),
    ...(row.deactivated_at !== undefined && { deactivatedAt: row.deactivated_at }),
  };
}

/** GET /super-admin/accounts — unified browse of active and deactivated login accounts. */
async function list(): Promise<SuperAdminAccountBrowse> {
  const data = await apiGet<{
    active: ApiAccount[];
    deactivated: ApiAccount[];
    counts: { active: number; deactivated: number; total: number; pending_first_login: number };
  }>("/super-admin/accounts");
  return {
    active: data.active.map(mapAccount),
    deactivated: data.deactivated.map(mapAccount),
    counts: {
      active: data.counts.active,
      deactivated: data.counts.deactivated,
      total: data.counts.total,
      pendingFirstLogin: data.counts.pending_first_login,
    },
  };
}

/** GET /super-admin/accounts?status=:status — one account-status bucket. */
async function listByStatus(status: SuperAdminAccountStatus): Promise<{
  status: SuperAdminAccountStatus;
  items: SuperAdminAccount[];
  count: number;
  pendingFirstLogin?: number;
}> {
  const data = await apiGet<{
    status: SuperAdminAccountStatus;
    items: ApiAccount[];
    count: number;
    pending_first_login?: number;
  }>(`/super-admin/accounts?status=${status}`);
  return {
    status: data.status,
    items: data.items.map(mapAccount),
    count: data.count,
    ...(data.pending_first_login !== undefined && { pendingFirstLogin: data.pending_first_login }),
  };
}

export const superAdminAccountService = { list, listByStatus };
