export const ADMINISTRATOR_ROLES = ["Super Admin", "Registrar Admin"] as const;
export type AdministratorRole = (typeof ADMINISTRATOR_ROLES)[number];

/** Frontend-mapped administrator row (Super Admin or Registrar Admin account). */
export type Administrator = {
  id: number;
  firstName: string;
  midName: string | null;
  lastName: string;
  gender: string;
  civilStatus: string;
  /** Raw department string from backend, e.g. "CS - Computer Science". */
  department: string;
  /** Department code extracted from `department` (part before " - "). */
  departmentCode: string;
  mobile: string | null;
  email: string | null;
  roleName: AdministratorRole;
};

/** Creates the login account + admin/registrar profile in one shot (temp password emailed). */
export type CreateAdministratorAccountInput = {
  departmentId: number;
  firstName: string;
  midName?: string;
  lastName: string;
  email: string;
  mobile: string;
  roleName: AdministratorRole;
  /** Enum values fetched via enumService; omitted = "N/A" on the server. */
  gender?: string;
  civilStatus?: string;
};

/** GET /super-admin/admin-accounts/<id> response, camelCased. */
export type AdministratorDetail = {
  id: number;
  firstName: string;
  midName: string | null;
  lastName: string;
  gender: string;
  civilStatus: string;
  mobile: string | null;
  email: string | null;
  accountActive: boolean | null;
};

/** PUT /super-admin/admin-accounts/<id> body — only name/contact fields are editable. */
export type UpdateAdministratorInput = {
  firstName?: string;
  midName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
};
