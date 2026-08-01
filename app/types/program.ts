/**
 * The backend stores program_type as a free string, so the values below are
 * what gets saved and displayed — no separate label mapping.
 */
export const PROGRAM_TYPES = ["Bachelor Degree", "Associate Degree"] as const;

export const PROGRAM_TYPE_YEARS: Record<string, number> = {
  "Bachelor Degree": 4,
  "Associate Degree": 2,
};

export type Program = {
  id: number;
  /** Department abbrev from GET /programs, e.g. "CITE". */
  departmentAbbrev: string;
  abbrev: string;
  name: string;
  /** Backend program_type string, e.g. "Bachelor Degree". */
  type: string;
  lengthYears: number;
};

/** Shape of GET /programs/:id/delete-preview and the DELETE /programs/:id payload. */
export type ProgramDeletePreview = {
  program: {
    program_id: number;
    program_abbrev: string;
    program_name: string;
  };
  /** False when real students or assigned instructors block the delete. */
  deletable: boolean;
  blockers: {
    students: number;
    faculty_assignments: { instructor_name: string; subject_code: string }[];
  };
  will_delete: {
    curriculum_links: number;
    /** A subject with `shared: true` is unlinked from this program, not deleted. */
    subjects: { subject_id: number; subject_code: string; shared: boolean }[];
    sets: { set_id: number; set_name: string }[];
    regular_schedules: number;
  };
};

/** Programs are linked to departments by name on create and update. */
export type CreateProgramInput = {
  departmentName: string;
  abbrev: string;
  name: string;
  type: string;
  lengthYears: number;
};

export type UpdateProgramInput = Partial<CreateProgramInput>;
