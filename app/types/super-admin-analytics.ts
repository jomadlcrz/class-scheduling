/** The raw analytics payload `GET /super-admin/analytics` returns — a system-wide
 * account and RBAC snapshot, not scoped to any school term. The backend computes
 * the numbers and ships no colours, chart types or layout — every presentational
 * decision is made here. */

export type SuperAdminRole =
  | "SUPER_ADMIN"
  | "REGISTRAR_ADMIN"
  | "DEAN"
  | "INSTRUCTOR"
  | "STUDENT";

export type SuperAdminAccount = {
  user_id: number;
  email: string;
  pending_first_login: boolean;
  /** Backend RoleName enum names, e.g. ["INSTRUCTOR"]. */
  roles: SuperAdminRole[];
};

export type SuperAdminAccountCounts = {
  total: number;
  active: number;
  deactivated: number;
  pending_first_login: number;
};

export type SuperAdminAccounts = {
  active: SuperAdminAccount[];
  deactivated: SuperAdminAccount[];
  counts: SuperAdminAccountCounts;
};

export type SuperAdminRoleCount = {
  role: SuperAdminRole;
  active: number;
  inactive: number;
  total: number;
};

export type SuperAdminUngrantedPermission = {
  permission_id: number;
  permission_slug: string;
  description: string;
};

export type SuperAdminRbac = {
  roles: number;
  permissions_total: number;
  permissions_ungranted_count: number;
  permissions_ungranted: SuperAdminUngrantedPermission[];
};

export type StudentProfileWithoutLogin = {
  student_profile_id: number;
  student_id: string | null;
  full_name: string;
};

export type SuperAdminSummary = {
  accounts_total: number;
  accounts_active: number;
  accounts_inactive: number;
  accounts_pending_first_login: number;
  roles: number;
  permissions_total: number;
  permissions_ungranted: number;
  student_profiles_without_login: number;
};

export type SuperAdminAnalytics = {
  accounts: SuperAdminAccounts;
  accounts_by_role: SuperAdminRoleCount[];
  rbac: SuperAdminRbac;
  student_profiles_without_login: StudentProfileWithoutLogin[];
  summary: SuperAdminSummary;
  meta: Record<string, never>;
};
