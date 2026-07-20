import { ApiError, apiGet, apiPost } from "~/lib/api";
import type { PermissionSummary } from "~/types/permission";

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

export const permissionService = {
  list,
  create,
};
