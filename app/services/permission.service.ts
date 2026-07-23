import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type { DeletedPermission, PermissionSummary, RolePermission, UpdatePermissionInput } from "~/types/permission";

/**
 * Roles + permissions (super_admin RBAC module). The backend has no single
 * "create a role with its permissions" endpoint — creating a role from
 * scratch is a 3-call sequence: create the role, create the permission
 * slugs, then grant them to the role.
 */

type RoleResponse = {
  role_id: number;
  role_name: string;
  permissions: {
    permission_id: number;
    permission_slug: string;
    description: string;
  }[];
}[];

function mapRole(role: RoleResponse[number]): PermissionSummary {
  return {
    id: role.role_id,
    name: role.role_name,
    permissions: role.permissions.map((p) => ({
      id: p.permission_id,
      slug: p.permission_slug,
      description: p.description,
    })),
  };
}

/** GET /roles — every role with its currently granted permissions. 404 → empty. */
async function list(): Promise<PermissionSummary[]> {
  try {
    const data = await apiGet<RoleResponse>("/roles");
    return data.map(mapRole);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

/**
 * Creates a role (or reuses it if it already exists), creates the given
 * permission slugs, and grants them all to that role. If the permission
 * slugs step fails (e.g. a slug already exists elsewhere), the role may
 * already have been created with no permissions yet — the backend has no
 * transaction spanning all three calls, so a retry only needs to redo the
 * permissions/grant steps.
 */
async function create(input: {
  roleName: string;
  permissions: { permissionSlug: string; description: string }[];
}): Promise<string> {
  let roleId: number;
  try {
    const created = await apiPost<{ role: { role_id: number } }>("/roles", {
      roleName: input.roleName,
    });
    roleId = created.role.role_id;
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 409) throw err;
    const roles = await list();
    const existing = roles.find((r) => r.name === input.roleName);
    if (!existing) throw err;
    roleId = existing.id;
  }

  const createdPermissions = await apiPost<{
    permissions: { permission_id: number }[];
  }>(
    "/permissions",
    input.permissions.map((p) => ({ permissionSlug: p.permissionSlug, description: p.description })),
  );

  const data = await apiPost<{ message?: string }>(`/roles/${roleId}/permissions`, {
    permissionIds: createdPermissions.permissions.map((p) => p.permission_id),
  });
  return typeof data.message === "string" ? data.message : "";
}

type PermissionCatalogResponse = {
  permission_id: number;
  permission_slug: string;
  description: string | null;
}[];

/** GET /permissions — every permission that exists, granted or not. 404 → empty. */
async function listCatalog(): Promise<RolePermission[]> {
  try {
    const data = await apiGet<PermissionCatalogResponse>("/permissions");
    return data.map((p) => ({
      id: p.permission_id,
      slug: p.permission_slug,
      description: p.description ?? "",
    }));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

/** PUT /roles/{roleId}/permissions — declaratively sets a role's grants to exactly these permission ids. */
async function replace(roleId: number, permissionIds: number[]): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/roles/${roleId}/permissions`, {
    permissionIds,
  });
  return apiMessage(data);
}

/** DELETE /roles/{roleId}/permissions/{permissionId} — revokes a single permission from a role. */
async function revoke(roleId: number, permissionId: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/roles/${roleId}/permissions/${permissionId}`);
  return apiMessage(data);
}

/** POST /roles/{roleId}/permissions — idempotent add-only grant, unlike `replace` (PUT) which sets the full grant set. */
async function grant(roleId: number, permissionIds: number[]): Promise<string> {
  const data = await apiPost<{ message?: string }>(`/roles/${roleId}/permissions`, { permissionIds });
  return apiMessage(data);
}

type PermissionRecycleBinResponse = {
  permission_id: number;
  permission_slug: string;
  deactivated_at: string | null;
}[];

/** GET /permissions/recycle-bin — 404 → empty. */
async function listDeleted(): Promise<DeletedPermission[]> {
  let data: PermissionRecycleBinResponse;
  try {
    data = await apiGet<PermissionRecycleBinResponse>("/permissions/recycle-bin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((p) => ({ id: p.permission_id, slug: p.permission_slug, deactivatedAt: p.deactivated_at }));
}

/** GET /permissions/<id> */
async function get(id: number): Promise<RolePermission> {
  const p = await apiGet<{ permission_id: number; permission_slug: string; description: string | null }>(
    `/permissions/${id}`,
  );
  return { id: p.permission_id, slug: p.permission_slug, description: p.description ?? "" };
}

/** PUT /permissions/<id> */
async function update(id: number, input: UpdatePermissionInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/permissions/${id}`, input);
  return apiMessage(data);
}

/** POST /permissions — create a single permission. */
async function createPermission(input: { permissionSlug: string; description?: string }): Promise<string> {
  const data = await apiPost<{ message?: string }>("/permissions", {
    permissionSlug: input.permissionSlug,
    description: input.description ?? null,
  });
  return apiMessage(data);
}

/** POST /permissions — create multiple permissions in bulk. */
async function createPermissionBulk(input: { permissionSlug: string; description?: string }[]): Promise<string> {
  const data = await apiPost<{ message?: string }>(
    "/permissions",
    input.map((p) => ({ permissionSlug: p.permissionSlug, description: p.description ?? null })),
  );
  return apiMessage(data);
}

/** DELETE /permissions/<id> — soft delete; 409 if still granted to a role. */
async function remove(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/permissions/${id}`);
  return apiMessage(data);
}

/** PATCH /permissions/<id>/restore */
async function restore(id: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/permissions/${id}/restore`);
  return apiMessage(data);
}

/** POST /roles — create multiple roles in bulk (JSON array body). */
async function createRoleBulk(input: { roleName: string }[]): Promise<string> {
  const data = await apiPost<{ message?: string }>("/roles", input);
  return apiMessage(data);
}

export const permissionService = {
  list,
  create,
  createRoleBulk,
  createPermission,
  createPermissionBulk,
  listCatalog,
  replace,
  revoke,
  grant,
  listDeleted,
  get,
  update,
  remove,
  restore,
};
