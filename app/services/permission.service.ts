import { ApiError, apiGet, apiMessage, apiPost } from "~/lib/api";
import type { PermissionSummary } from "~/types/permission";

/** Roles + permissions from the backend (super_admin module). Read-only. */

type PermissionSlugsResponse = {
  role_id: number;
  role_name: string;
  permissions: {
    permission_id: number;
    permission_slug: string;
    description: string;
  }[];
}[];

async function list(): Promise<PermissionSummary[]> {
  let data: PermissionSlugsResponse;
  try {
    data = await apiGet<PermissionSlugsResponse>("/super-admin/permission-slugs");
  } catch (err) {
    // The backend answers an empty roles table with 404 + [].
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }

  return data.map((role) => ({
    id: role.role_id,
    name: role.role_name,
    permissions: role.permissions.map((p) => ({
      id: p.permission_id,
      slug: p.permission_slug,
      description: p.description,
    })),
  }));
}

/** POST /super-admin/permission-slugs — creates a role with its permission slugs. Returns the backend message. */
async function create(input: {
  roleName: string;
  permissions: { permissionSlug: string; description: string }[];
}): Promise<string> {
  const data = await apiPost<{ message?: string }>("/super-admin/permission-slugs", {
    roleName: input.roleName,
    permissions: input.permissions.map((p) => ({
      permissionSlug: p.permissionSlug,
      description: p.description,
    })),
  });
  return apiMessage(data);
}

export const permissionService = {
  list,
  create,
};
