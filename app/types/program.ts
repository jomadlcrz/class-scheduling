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
  departmentCode: string;
  code: string;
  name: string;
  /** Backend program_type string, e.g. "Bachelor Degree". */
  type: string;
  lengthYears: number;
};

/** Programs are linked to departments by name on create; not updatable afterwards. */
export type CreateProgramInput = {
  departmentName: string;
  code: string;
  name: string;
  type: string;
  lengthYears: number;
};

export type UpdateProgramInput = Partial<Omit<CreateProgramInput, "departmentName">>;
