import type { Permission, RoleDefinition, RoleSummary } from "~/types/role";
import { accounts, delay } from "~/services/mock-data";

/**
 * MOCK role service. Roles are fixed system roles for now — the page is
 * read-only. Custom roles would turn ROLE_DEFINITIONS into store data.
 */

export const PERMISSIONS: Permission[] = [
  { key: "manage-users", label: "Manage users" },
  { key: "manage-roles", label: "Manage roles" },
  { key: "manage-curriculum", label: "Manage curriculum" },
  { key: "manage-subjects", label: "Manage subjects & sections" },
  { key: "manage-facilities", label: "Manage rooms & facilities" },
  { key: "build-schedules", label: "Build & publish schedules" },
  { key: "resolve-conflicts", label: "Resolve conflicts" },
  { key: "view-reports", label: "View reports" },
  { key: "view-own-schedule", label: "View own schedule" },
];

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: "admin",
    label: "Admin",
    description: "Full system access, including user and role management.",
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    role: "registrar",
    label: "Registrar",
    description: "Owns academic data and builds the official schedules.",
    permissions: [
      "manage-curriculum",
      "manage-subjects",
      "manage-facilities",
      "build-schedules",
      "resolve-conflicts",
      "view-reports",
      "view-own-schedule",
    ],
  },
  {
    role: "dean",
    label: "Dean",
    description: "Oversees a college: curriculum, loads, and conflict sign-off.",
    permissions: [
      "manage-curriculum",
      "manage-subjects",
      "resolve-conflicts",
      "view-reports",
      "view-own-schedule",
    ],
  },
  {
    role: "faculty",
    label: "Faculty",
    description: "Teaching staff — sees own teaching load and schedule.",
    permissions: ["view-own-schedule"],
  },
  {
    role: "student",
    label: "Student",
    description: "Enrolled student — sees own class schedule.",
    permissions: ["view-own-schedule"],
  },
];

async function list(): Promise<RoleSummary[]> {
  await delay();
  return ROLE_DEFINITIONS.map((def) => ({
    ...def,
    memberCount: accounts.filter((a) => a.role === def.role).length,
  }));
}

export const roleService = {
  list,
};
