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

/** PUT /permissions/<id> body — both fields optional, only what's supplied is changed. */
export type UpdatePermissionInput = {
  permissionSlug?: string;
  description?: string;
};

/** GET /permissions/recycle-bin row. */
export type DeletedPermission = {
  id: number;
  slug: string;
  deactivatedAt: string | null;
};
