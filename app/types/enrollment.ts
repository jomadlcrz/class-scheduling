/** Term enrollment directory types — mirror the backend's /enrollments payloads (mapped to camelCase). */

export type EnrollmentSubjectLine = {
  subjectId: number;
  subjectCode: string | null;
  descriptiveTitle: string | null;
  units: number | null;
};

/** One term enrollment row for a student. Status/state strings are backend-owned — shown verbatim. */
export type EnrollmentRow = {
  enrollmentId: number;
  studentProfileId: number;
  yearLevel: number;
  /** "ABBR - Full Program Name" (backend-formatted). */
  program: string | null;
  set: string | null;
  /** "Regular" | "Irregular" */
  enrolledStatus: string;
  /** "Enrolled" | "Dropped" | "Withdrawn" | "Voided" */
  enrollmentState: string;
  studentType: string | null;
  schoolYear: string | null;
  semesterNumber: number;
  syId: number;
  termClosed: boolean;
  subjects: EnrollmentSubjectLine[];
};

/** A student and their enrollment(s) for the selected term (usually one row). */
export type EnrollmentStudent = {
  studentProfileId: number;
  studentId: string | null;
  name: string;
  email: string | null;
  mobile: string | null;
  /** "Has an account" | "No account yet" — backend display string. */
  accountStatus: string;
  profilePhotoUrl: string | null;
  enrollments: EnrollmentRow[];
};

export type EnrollmentFacetCounts = {
  total: number;
  regular: number;
  irregular: number;
  enrolled: number;
  dropped: number;
  withdrawn: number;
  voided: number;
};

export type EnrollmentFacets = {
  programs: string[];
  sets: string[];
  counts: EnrollmentFacetCounts;
};
