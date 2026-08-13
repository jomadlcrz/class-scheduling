import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type { PermissionSummary, RolePermission, UpdatePermissionInput } from "~/types/permission";

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

/** GET /permissions/<id> — fresh detail used before editing. */
async function get(id: number): Promise<RolePermission> {
  const p = await apiGet<PermissionCatalogResponse[number]>(`/permissions/${id}`);
  return { id: p.permission_id, slug: p.permission_slug, description: p.description ?? "" };
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

export type PermissionArchivePreview = {
  permission: { permission_id: number; permission_slug: string };
  archivable: boolean;
  blockers: { role_grants: number };
  willArchive: Record<string, never>;
};

/** PUT /permissions/<id> */
async function update(id: number, input: UpdatePermissionInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/permissions/${id}`, input);
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
async function getArchivePreview(id: number): Promise<PermissionArchivePreview> {
  return apiGet<PermissionArchivePreview>(`/permissions/${id}/archive-preview`);
}

async function archive(id: number, confirm: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/permissions/${id}/archive`, { confirm });
  return apiMessage(data);
}

/** POST /roles — create multiple roles in bulk (JSON array body). */
async function createRoleBulk(input: { roleName: string }[]): Promise<string> {
  const data = await apiPost<{ message?: string }>("/roles", input);
  return apiMessage(data);
}

export const permissionService = {
  list,
  createRoleBulk,
  createPermissionBulk,
  listCatalog,
  get,
  replace,
  revoke,
  update,
  getArchivePreview,
  archive,
};
