import type { YearLevel } from "~/types/subject";

/** A class set: a named group of students within a program and year level. */
export type ClassSet = {
  id: number;
  /** Program abbrev, e.g. "BSIS". */
  program: string;
  yearLevel: YearLevel;
  /** Short identifier, e.g. "A", "B". Unique per program + year level. */
  setCode: string;
};

export type CreateSetInput = Omit<ClassSet, "id">;

export type UpdateSetInput = Partial<CreateSetInput>;

/** Shape of GET /sets/:id/delete-preview and the DELETE /sets/:id payload. */
export type SetDeletePreview = {
  set: {
    set_id: number;
    set_code: string;
    set_name: string;
  };
  /** Everything the cascade will touch; nothing data-driven blocks the delete. */
  will_delete: {
    regular_schedules: number;
    /** Informational — StudentAcademic rows are never touched, just left pointing at the inactive set. */
    students_affected: number;
  };
};
