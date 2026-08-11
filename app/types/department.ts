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
  /** Backend `building_id` for edit resolution; may be null when not assigned. */
  buildingId: number | null;
  buildingName: string;
  /** Backend DepartmentType value — "Academic" or "Administrative". */
  departmentType: string;
  /** Backend `description` — optional rich-text or plain text. */
  description: string | null;
  /** Programs offered by the department, as returned by GET /departments. */
  programs: { abbrev: string; name: string }[];
  /** Public S3 URL, or null when no logo has been uploaded yet. */
  logoUrl: string | null;
  /** Public S3 URL, or null when no cover image has been uploaded yet. */
  coverImageUrl: string | null;
};

/** Buildings are referenced by id on create and update (backend expects buildingId). */
export type CreateDepartmentInput = {
  abbrev: string;
  name: string;
  /** Backend allows null — omit to leave unassigned. */
  buildingId?: number;
  /** Backend DepartmentType value; omit to let the backend default to Academic. */
  departmentType?: string;
  /** Optional description text. */
  description?: string;
};

export type UpdateDepartmentInput = {
  abbrev?: string;
  name?: string;
  buildingId?: number;
  departmentType?: string;
  description?: string;
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
  buildingId: number | null;
  departmentType: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
};

/** GET /departments/:id/overview — detail-page header + nested programs (both department types). */
export type DepartmentOverview = {
  id: number;
  abbrev: string;
  name: string;
  departmentType: string;
  buildingId: number | null;
  buildingName: string | null;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
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
  profilePhotoUrl: string | null;
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
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
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

/** Shape of GET /departments/:id/archive-preview. */
export type DepartmentDeletePreview = {
  department: {
    departmentId: number;
    departmentName: string;
    departmentAbbrev: string;
  };
  deletable: boolean;
  blockers: {
    staff: number;
  };
  willDelete: {
    programs: { programId: number; programAbbrev: string }[];
  };
};
