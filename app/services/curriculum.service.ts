import { apiGet } from "~/lib/api";
import type { CurriculumGroup, ProgramCurriculum } from "~/types/curriculum";
import type { Semester, YearLevel } from "~/types/subject";
import { programService } from "~/services/program.service";

/**
 * Program curriculum view. GET /subjects already returns the grouped
 * year → semester structure with unit totals, so it is mapped directly.
 */

type SubjectsResponse = {
  program_name: string;
  program_total_units: number;
  curriculum_details: {
    year_level: number;
    year_total_units: number;
    semester_details: {
      semester: number;
      semester_total_units: number;
      subjects: {
        subject_id: number;
        subject_code: string;
        descriptive_title: string;
        units: number;
        subject_type: string;
        prerequisites: { subject_code: string }[];
      }[];
    }[];
  }[];
}[];

async function getByProgram(programCode: string): Promise<ProgramCurriculum | null> {
  const [data, programs] = await Promise.all([
    apiGet<SubjectsResponse>("/subjects"),
    programService.list(),
  ]);

  const program = programs.find((p) => p.abbrev === programCode);
  if (!program) return null;

  // The response identifies programs by name only (no program_abbrev).
  const node = data.find((entry) => entry.program_name === program.name);

  const groups: CurriculumGroup[] = (node?.curriculum_details ?? [])
    .flatMap((year) =>
      year.semester_details.map((sem) => ({
        yearLevel: year.year_level as YearLevel,
        semester: sem.semester as Semester,
        subjects: sem.subjects.map((s) => ({
          id: s.subject_id,
          program: programCode,
          yearLevel: year.year_level as YearLevel,
          semester: sem.semester as Semester,
          code: s.subject_code,
          title: s.descriptive_title,
          units: s.units,
          subjectType: s.subject_type,
          prerequisites: s.prerequisites.map((p) => p.subject_code),
        })),
        totalUnits: sem.semester_total_units,
      })),
    )
    .sort((a, b) => a.yearLevel - b.yearLevel || a.semester - b.semester);

  return {
    programCode,
    programName: program.name,
    departmentCode: program.departmentAbbrev,
    groups,
    totalUnits: node?.program_total_units ?? 0,
  };
}

async function listPrograms() {
  return programService.list();
}

export const curriculumService = { getByProgram, listPrograms };
