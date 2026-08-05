export type Program = {
  id: number;
  /** Department abbrev from GET /programs, e.g. "CITE". */
  departmentAbbrev: string;
  abbrev: string;
  name: string;
  /** Backend program_type enum value. */
  type: string;
  lengthYears: number;
  /** Backend program_description, when returned by a program listing. */
  description?: string | null;
};

/** Shape of GET /programs/:id/delete-preview and the DELETE /programs/:id payload. */
export type ProgramDeletePreview = {
  program: {
    program_id: number;
    program_abbrev: string;
    program_name: string;
  };
  /** Everything the cascade will touch; nothing data-driven blocks the delete. */
  will_delete: {
    /** REGULAR students are not deleted — their academic records just end up pointing at the inactive program. */
    regular_students_affected: number;
    /** Instructor subject assignments for this program's curriculum, hard-deleted. */
    faculty_assignments: { instructor_name: string; subject_code: string }[];
    /** IRREGULAR students' enrolled-subject rows for this program, hard-deleted. */
    enrolled_subjects: number;
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
