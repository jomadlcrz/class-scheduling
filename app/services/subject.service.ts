import { apiDelete, apiGet, apiPost, apiPut } from "~/lib/api";
import type { Semester, Subject, UpdateSubjectInput, YearLevel } from "~/types/subject";

/** Curriculum subjects against the curriculums module (registrar_admin). */

type SubjectsResponse = {
  program_name: string;
  program_abbrev: string;
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

/** GET /subjects — grouped per program/year/semester; flattened here. */
async function list(): Promise<Subject[]> {
  const data = await apiGet<SubjectsResponse>("/subjects");
  return data.flatMap((program) =>
    program.curriculum_details.flatMap((year) =>
      year.semester_details.flatMap((sem) =>
        sem.subjects.map((s) => ({
          id: s.subject_id,
          program: program.program_abbrev,
          yearLevel: year.year_level as YearLevel,
          semester: sem.semester as Semester,
          code: s.subject_code,
          title: s.descriptive_title,
          units: s.units,
          subjectType: s.subject_type,
          prerequisites: s.prerequisites.map((p) => p.subject_code),
        })),
      ),
    ),
  );
}

export type CurriculumSubjectEntry = {
  yearLevel: number;
  semester: number;
  code: string;
  title: string;
  units: number;
  subjectType: string;
  prerequisites: string[];
};

/** POST /subjects — one nested payload creates a whole batch of curriculum entries. */
async function createCurriculum(
  programAbbrev: string,
  programName: string,
  entries: CurriculumSubjectEntry[],
): Promise<void> {
  const yearLevels = new Map<number, Map<number, CurriculumSubjectEntry[]>>();
  for (const entry of entries) {
    const semesters = yearLevels.get(entry.yearLevel) ?? new Map();
    yearLevels.set(entry.yearLevel, semesters);
    const subjects = semesters.get(entry.semester) ?? [];
    semesters.set(entry.semester, subjects);
    subjects.push(entry);
  }

  await apiPost("/subjects", {
    programAbbrev,
    programName,
    yearLevels: [...yearLevels.entries()].map(([yearName, semesters]) => ({
      yearName,
      semesters: [...semesters.entries()].map(([semesterName, subjects]) => ({
        semesterName,
        subjects: subjects.map((s) => ({
          subjectCode: s.code,
          descriptiveTitle: s.title,
          units: s.units,
          subjectType: s.subjectType,
          prerequisites: s.prerequisites.map((code) => ({ subjectCode: code })),
        })),
      })),
    })),
  });
}

/** PUT /subjects/:id — the curriculum slot (program/year/semester) is fixed. */
async function update(id: number, input: UpdateSubjectInput): Promise<void> {
  await apiPut(`/subjects/${id}`, {
    subjectCode: input.code,
    descriptiveTitle: input.title,
    units: input.units,
    subjectType: input.subjectType,
    prerequisites: input.prerequisites.map((code) => ({ subjectCode: code })),
  });
}

/** DELETE /subjects/:id — soft delete; the backend requires the code as confirmation. */
async function remove(id: number, confirmCode: string): Promise<void> {
  await apiDelete(`/subjects/${id}`, { confirm: confirmCode });
}

export const subjectService = {
  list,
  createCurriculum,
  update,
  remove,
};
