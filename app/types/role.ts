import type { Role } from "~/types/user";

export type Permission = {
  key: string;
  label: string;
};

export type RoleDefinition = {
  role: Role;
  label: string;
  description: string;
  /** Keys from the PERMISSIONS catalog this role holds. */
  permissions: string[];
};

export type RoleSummary = RoleDefinition & { memberCount: number };
