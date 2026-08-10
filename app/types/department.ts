import type { BadgeTone } from "~/components/ui/badge";

/**
 * Department type vocabulary lives in the backend (app/enums.py) and is fetched
 * via enumService — only display tones are mapped here, by value.
 */
export const DEPARTMENT_TYPE_TONES: Record<string, BadgeTone> = {
  Academic: "violet",
  Administrative: "slate",
};

export type Department = {
  id: number;
  abbrev: string;
  name: string;
  buildingName: string;
  /** Backend DepartmentType value — "Academic" or "Administrative". */
  departmentType: string;
  /** Programs offered by the department, as returned by GET /departments. */
  programs: { abbrev: string; name: string }[];
  /** Public S3 URL, or null when no logo has been uploaded yet. */
  logoUrl: string | null;
};

/** Buildings are referenced by id on create and update (backend expects buildingId). */
export type CreateDepartmentInput = {
  abbrev: string;
  name: string;
  buildingId: number;
  /** Backend DepartmentType value; omit to let the backend default to Academic. */
  departmentType?: string;
};

export type UpdateDepartmentInput = {
  abbrev?: string;
  name?: string;
  buildingId?: number;
  departmentType?: string;
};

/** Real backend department (integer id) — used where the API needs one. */
export type DepartmentOption = {
  id: number;
  abbrev: string;
  name: string;
};

/** GET /departments/:id response — a leaner shape than the nested-list `Department` (no buildingName join/programs). */
export type DepartmentDetail = {
  id: number;
  abbrev: string;
  name: string;
  buildingId: number;
  departmentType: string;
  logoUrl: string | null;
};

/** GET /departments/:id/overview — detail-page header + nested programs (both department types). */
export type DepartmentOverview = {
  id: number;
  abbrev: string;
  name: string;
  departmentType: string;
  buildingId: number | null;
  buildingName: string | null;
  logoUrl: string | null;
  totalPrograms: number;
  programs: ProgramSummary[];
};

/** One program row from program_summary (overview / academic-detail). */
export type ProgramSummary = {
  id: number;
  abbrev: string;
  name: string;
  programType: string;
  length: number | null;
  description: string | null;
};

/** GET /departments/:id/office-staff — a staff row for administrative departments. */
export type OfficeStaffMember = {
  key: string;
  firstName: string;
  midName: string | null;
  lastName: string;
  roleName: string;
  email: string | null;
  mobile: string | null;
};

/** GET /departments/:id/office-staff — response shape. */
export type OfficeStaffPayload = {
  departmentId: number;
  departmentAbbrev: string;
  staff: OfficeStaffMember[];
};

/** GET /departments/:id/academic-detail — one enrolled student row. */
export type DepartmentStudent = {
  studentProfileId: number;
  studentId: string;
  fullName: string;
  programId: number;
  programAbbrev: string;
  programName: string;
  yearLevel: number;
  set: string | null;
  enrolledStatus: string;
  studentType: string | null;
  email: string | null;
  mobile: string | null;
  profilePhotoUrl: string | null;
};

/** GET /departments/:id/academic-detail — dean, programs (with set counts), and students. */
export type AcademicDepartmentDetail = {
  departmentId: number;
  departmentAbbrev: string;
  departmentName: string;
  departmentType: string;
  buildingId: number | null;
  buildingName: string | null;
  logoUrl: string | null;
  dean: {
    deanProfileId: number;
    fullName: string;
    email: string | null;
    mobile: string | null;
    profilePhotoUrl: string | null;
  } | null;
  totalPrograms: number;
  totalStudents: number;
  programs: (ProgramSummary & { totalSets: number })[];
  students: DepartmentStudent[];
};

/** Shape of GET /departments/:id/delete-preview and the DELETE /departments/:id payload.
 * Programs cascade fully (same as a lone program delete); staff assignment still
 * blocks outright (accounts are never touched by this feature). */
export type DepartmentDeletePreview = {
  department: {
    department_id: number;
    department_name: string;
    department_abbrev: string;
  };
  /** False when staff are still assigned (blockers.staff > 0). */
  deletable: boolean;
  blockers: {
    staff: number;
  };
  will_delete: {
    /** Every active program that cascades exactly like DELETE /programs/:id would. */
    programs: { program_id: number; program_abbrev: string }[];
  };
};
