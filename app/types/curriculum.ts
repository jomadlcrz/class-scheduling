import type { Subject, Semester, YearLevel } from "~/types/subject";

export type CurriculumGroup = {
  yearLevel: YearLevel;
  semester: Semester;
  subjects: Subject[];
  totalUnits: number;
};

export type ProgramCurriculum = {
  programCode: string;
  programName: string;
  departmentCode: string;
  groups: CurriculumGroup[];
  totalUnits: number;
};
