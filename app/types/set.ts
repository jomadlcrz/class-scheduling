import type { YearLevel } from "./subject";

/** A class set: a named group of students within a program and year level. */
export type ClassSet = {
  id: string;
  program: string;
  yearLevel: YearLevel;
  /** Short identifier, e.g. "A", "B", "1A". Unique per program + year level. */
  setCode: string;
};

export type CreateSetInput = Omit<ClassSet, "id">;

export type UpdateSetInput = Partial<CreateSetInput>;
