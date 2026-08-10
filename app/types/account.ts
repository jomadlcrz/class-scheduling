/** One login account row from GET /super-admin/accounts. Roles are backend
 * display values ("Super Admin", "Registrar Admin", "Dean", "Instructor", "Student"). */
export type Account = {
  userId: number;
  email: string;
  roles: string[];
  /** True while the account is active but the user hasn't completed first-login yet. */
  pendingFirstLogin: boolean;
  /** ISO timestamp — present only for deactivated accounts. */
  deactivatedAt: string | null;
};

/** GET /super-admin/accounts (no status filter) — both buckets plus headline counts. */
export type AccountsPayload = {
  active: Account[];
  deactivated: Account[];
  counts: {
    active: number;
    deactivated: number;
    total: number;
    pendingFirstLogin: number;
  };
};
