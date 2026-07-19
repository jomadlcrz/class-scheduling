export const ADMINISTRATOR_ROLES = ["Super Admin", "Registrar Admin"] as const;
export type AdministratorRole = (typeof ADMINISTRATOR_ROLES)[number];

/** Frontend-mapped administrator row (Super Admin or Registrar Admin account). */
export type Administrator = {
  id: number;
  firstName: string;
  midName: string | null;
  lastName: string;
  email: string;
  roleName: AdministratorRole;
  /** Only set for Registrar Admin accounts — Super Admin has no department. */
  departmentId: number | null;
  isActive: boolean;
  isTemp: boolean;
};

/** Creates the login account + admin/registrar profile in one shot (temp password emailed). */
export type CreateAdministratorAccountInput = {
  firstName: string;
  midName?: string;
  lastName: string;
  email: string;
  roleName: AdministratorRole;
  /** Required only when roleName is "Registrar Admin". */
  departmentId?: number;
};
