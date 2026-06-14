import type { Subject, Semester, YearLevel } from "./subject";

export type CurriculumGroup = {
  yearLevel: YearLevel;
  semester: Semester;
  subjects: Subject[];
  totalUnits: number;
};

export type ProgramCurriculum = {
  programCode: string;
  programName: string;
  groups: CurriculumGroup[];
  totalUnits: number;
};
