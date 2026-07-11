import type { BadgeTone } from "~/components/ui/badge";

/**
 * Shape returned by GET /super-admin/create-faculty-accounts.
 * Keys are snake_case to match the backend verbatim.
 */
export type RawFaculty = {
  faculty_id: number;
  first_name: string;
  mid_name: string | null;
  last_name: string;
  gender: string;
  civil_status: string;
  department: string;
  mobile: string | null;
  email: string | null;
};

/** Frontend-mapped faculty row. */
export type Faculty = {
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
  /** Enum values fetched via enumService; omitted = "N/A" on the server. */
  gender?: string;
  civilStatus?: string;
};

export function mapFaculty(raw: RawFaculty): Faculty {
  const deptParts = raw.department.split(" - ");
  return {
    id: raw.faculty_id,
    firstName: raw.first_name,
    midName: raw.mid_name,
    lastName: raw.last_name,
    gender: raw.gender,
    civilStatus: raw.civil_status,
    department: raw.department,
    departmentCode: deptParts[0] ?? raw.department,
    mobile: raw.mobile,
    email: raw.email,
  };
}
