/**
 * Payload of GET /deans/offering-coverage?sy_id=&semester_number= — a rollup of
 * the offerable minor / general-education subjects for one term, grouped
 * department → program, flagging which still have no instructor assigned. The
 * backend scopes the read by role (registrar: college-wide; dean: own
 * department only). Kept in the backend's snake_case, matching the analytics
 * reads (getAnalytics) that this endpoint sits alongside.
 */

export type OfferingCoverageSubject = {
  curriculum_detail_id: number;
  subject_id: number;
  subject_code: string;
  descriptive_title: string;
  subject_type: string | null;
  year_level: number;
  /** Present in current payloads; kept optional so old cached payloads fail safe. */
  semester_number?: number;
  assigned: boolean;
  instructors: string[];
  /** Instructor names plus their home department abbrev — present in current payloads. */
  instructor_details?: { name: string; department_abbrev: string | null }[];
};

export type OfferingCoverageProgram = {
  program_id: number;
  program_abbrev: string;
  program_name: string;
  unassigned_count: number;
  total_count: number;
  subjects: OfferingCoverageSubject[];
};

export type OfferingCoverageDepartment = {
  department_id: number;
  department_abbrev: string;
  department_name: string;
  unassigned_count: number;
  total_count: number;
  programs: OfferingCoverageProgram[];
};

export type OfferingCoverage = {
  departments: OfferingCoverageDepartment[];
  total_unassigned: number;
};
