import type { CurriculumGroup, ProgramCurriculum } from "~/types/curriculum";
import type { Semester, YearLevel } from "~/types/subject";
import { programService } from "~/services/program.service";
import { subjectService } from "~/services/subject.service";

async function getByProgram(programCode: string): Promise<ProgramCurriculum | null> {
  const [allSubjects, allPrograms] = await Promise.all([
    subjectService.list(),
    programService.list(),
  ]);

  const program = allPrograms.find((p) => p.code === programCode);
  if (!program) return null;

  const programSubjects = allSubjects.filter((s) => s.program === programCode);

  const groupMap = new Map<string, CurriculumGroup>();
  for (const subject of programSubjects) {
    const key = `${subject.yearLevel}-${subject.semester}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        yearLevel: subject.yearLevel as YearLevel,
        semester: subject.semester as Semester,
        subjects: [],
        totalUnits: 0,
      });
    }
    const group = groupMap.get(key)!;
    group.subjects.push(subject);
    group.totalUnits += subject.units;
  }

  const groups = Array.from(groupMap.values()).sort((a, b) => {
    if (a.yearLevel !== b.yearLevel) return a.yearLevel - b.yearLevel;
    return a.semester - b.semester;
  });

  return {
    programCode,
    programName: program.name,
    groups,
    totalUnits: groups.reduce((sum, g) => sum + g.totalUnits, 0),
  };
}

async function listPrograms() {
  return programService.list();
}

export const curriculumService = { getByProgram, listPrograms };
