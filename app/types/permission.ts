export type RolePermission = {
  id: number;
  /** e.g. "system:manage_roles" */
  slug: string;
  description: string;
};

export type PermissionSummary = {
  id: number;
  /** Backend display value, e.g. "Super Admin". */
  name: string;
  permissions: RolePermission[];
};
