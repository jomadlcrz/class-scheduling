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
  roles: { id: number; name: string }[];
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
};
