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
