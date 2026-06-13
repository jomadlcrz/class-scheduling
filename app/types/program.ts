export const PROGRAM_TYPES = ["bachelor", "associate"] as const;
export type ProgramType = (typeof PROGRAM_TYPES)[number];

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  bachelor: "Bachelor Degree",
  associate: "Associate Degree",
};

export const PROGRAM_TYPE_YEARS: Record<ProgramType, number> = {
  bachelor: 4,
  associate: 2,
};

export type Program = {
  id: string;
  departmentId: string;
  departmentCode: string;
  code: string;
  name: string;
  type: ProgramType;
  lengthYears: number;
};

export type CreateProgramInput = Omit<Program, "id">;
export type UpdateProgramInput = Partial<CreateProgramInput>;
