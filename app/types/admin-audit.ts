export type AdminAuditAccount = {
  userId: number;
  email: string | null;
  display: string | null;
};

export type AdminAuditPerformer = {
  userId: number;
  email: string | null;
  display: string | null;
};

export type AdminAuditEntry = {
  id: number;
  occurredAt: string | null;
  occurredAtDisplay: string | null;
  action: string;
  actionLabel: string;
  account: AdminAuditAccount;
  performedBy: AdminAuditPerformer | null;
  reason: string | null;
};

export type AdminAuditResult = {
  items: AdminAuditEntry[];
  page: number;
  perPage: number;
  total: number;
  pages: number;
};
