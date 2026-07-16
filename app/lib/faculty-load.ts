import type { DepartmentSubjectProgram, ProgramLoadInput } from "~/types/faculty-load";

export type SubjectChoice = {
  /** `"PROGRAM CODE"`, e.g. "BSIT IT101" — unique even when a subject is shared across programs. */
  key: string;
  programAbbrev: string;
  subjectCode: string;
  descriptiveTitle: string;
  units: number;
};

export function facultyKey(firstName: string, lastName: string): string {
  return `${firstName}|${lastName}`;
}

/** Flattens the department curriculum tree into a deduped, pickable subject list. */
export function flattenDepartmentSubjects(programs: DepartmentSubjectProgram[]): SubjectChoice[] {
  const seen = new Set<string>();
  const result: SubjectChoice[] = [];
  for (const program of programs) {
    if (!program.programAbbrev) continue;
    for (const year of program.curriculumDetails) {
      for (const sem of year.semesterDetails) {
        for (const subject of sem.subjects) {
          const key = `${program.programAbbrev} ${subject.subjectCode}`;
          if (seen.has(key)) continue;
          seen.add(key);
          result.push({
            key,
            programAbbrev: program.programAbbrev,
            subjectCode: subject.subjectCode,
            descriptiveTitle: subject.descriptiveTitle,
            units: subject.units,
          });
        }
      }
    }
  }
  return result;
}

/** Regroups a flat list of picked subjects back into the backend's programs[] shape. */
export function groupSubjectsByProgram(subjects: SubjectChoice[]): ProgramLoadInput[] {
  const byProgram = new Map<string, ProgramLoadInput>();
  for (const s of subjects) {
    let entry = byProgram.get(s.programAbbrev);
    if (!entry) {
      entry = { programAbbrev: s.programAbbrev, subjects: [] };
      byProgram.set(s.programAbbrev, entry);
    }
    entry.subjects.push({ subjectCode: s.subjectCode, descriptiveTitle: s.descriptiveTitle });
  }
  return [...byProgram.values()];
}
