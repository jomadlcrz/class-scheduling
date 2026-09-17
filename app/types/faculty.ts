import type { StudentAddress } from "~/types/student";

/** Frontend-mapped faculty row. */
export type Faculty = {
  id: number;
  firstName: string;
  midName: string | null;
  lastName: string;
  gender: string;
  civilStatus: string;
  /** "Full-Time" | "Part-Time" | "N/A" — backend EmploymentStatus, verbatim. */
  employmentStatus: string;
  /** "Mr." | "Ms." | "Mrs." | "Dr." | "Prof." | "N/A", verbatim. */
  prefixHonorific: string;
  /** Free text, e.g. "Instructor I", "Assistant Professor III". Null when none recorded. */
  academicRank: string | null;
  /** Raw department string from backend, e.g. "CS - Computer Science". */
  department: string;
  /** Department code extracted from `department` (part before " - "). */
  departmentCode: string;
  mobile: string | null;
  email: string | null;
  roles: { id: number; name: string }[];
  hasAccount: boolean;
  accountActive?: boolean | null;
  profilePhotoUrl: string | null;
  /** Present when sourced from mock data; absent for real data. */
  status?: "active" | "inactive";
  /** Present when sourced from mock data; absent for real data. */
  maxWeeklyHours?: number;
};

/** Creates the login account + faculty profile in one shot (temp password emailed). */
export type CreateFacultyAccountInput = {
  departmentId: number;
  firstName: string;
  midName?: string;
  lastName: string;
  email: string;
  mobile: string;
  roleName: string;
  /** Enum values fetched via enumService; omitted = "N/A" on the server. */
  gender?: string;
  civilStatus?: string;
  /** Omitted = "N/A" on the server, i.e. HR has not confirmed it yet. */
  employmentStatus?: string;
  prefixHonorific?: string;
  /** Free text — no dropdown; the rank ladder differs by institution. */
  academicRank?: string | null;
  address?: StudentAddress | null;
};

/** GET /super-admin/faculty-accounts/<id> response, camelCased. */
export type FacultyDetail = {
  id: number;
  firstName: string;
  midName: string | null;
  lastName: string;
  gender: string;
  civilStatus: string;
  employmentStatus: string;
  prefixHonorific: string;
  academicRank: string | null;
  departmentId?: number;
  employeeId?: string | null;
  mobile: string | null;
  email: string | null;
  accountActive: boolean | null;
  address?: StudentAddress | null;
};

/** PUT /super-admin/faculty-accounts/<id> body */
export type UpdateFacultyInput = {
  firstName?: string;
  midName?: string | null;
  lastName?: string;
  mobile?: string;
  email?: string;
  gender?: string;
  civilStatus?: string;
  employmentStatus?: string;
  prefixHonorific?: string;
  academicRank?: string | null;
  departmentId?: number;
  employeeId?: string | null;
  address?: StudentAddress | null;
};
