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
  gender: string | null;
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

export type EnrollmentRegistration = {
  enrolled: boolean;
  meta: {
    student_id: string | null;
    student_name: string | null;
    full_name: string | null;
    name_natural: string | null;
    enrolled_status?: string | null;
    program_abbrev?: string | null;
    program_name?: string | null;
    set_name?: string | null;
    year_level?: number | null;
    school_year?: string | null;
    semester_name?: string | null;
    registrar_name?: string | null;
  };
  summary: {
    total_subjects: number;
    total_units: number;
  };
  subjects: {
    subject_id: number;
    subject_code: string | null;
    descriptive_title: string | null;
    units: number | null;
    lec_hours: number | null;
    lab_hours: number | null;
  }[];
  schedule: {
    subject_code: string | null;
    day: string | null;
    start_time: string | null;
    end_time: string | null;
    room: string | null;
    instructor: string | null;
  }[];
};

/**
 * One returning-student row from GET /enrollments/directory — a student's latest enrollment
 * plus whether they can be re-enrolled into the selected target term.
 */
export type ReenrollDirectoryRow = {
  studentProfileId: number;
  studentId: string | null;
  name: string;
  /** Program abbrev, e.g. "BSIT" — from the latest enrollment. */
  program: string;
  yearLevel: number;
  /** Semester number of the student's most recent enrollment. */
  semesterNumber: number;
  /** "Regular" / "Irregular" as of the latest enrollment. */
  enrolledStatus: string;
  studentType: string | null;
  set: string | null;
  lastSchoolYear: string | null;
  /** Backend state string of the latest enrollment, shown verbatim. */
  lastEnrollmentState: string;
  /** Whether this student can be re-enrolled into the target term. */
  reEnrollEligible: boolean;
  /** Backend reason they can't be re-enrolled (verbatim), when reEnrollEligible is false. */
  reEnrollBlockReason: string | null;
  /** Already has an enrollment in the selected target term. */
  enrolledInTargetTerm: boolean;
  /** "Has an account" / "No account yet" — backend display string. */
  accountStatus: string;
  profilePhotoUrl: string | null;
};
