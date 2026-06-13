import type { ClassSet, CreateSetInput, UpdateSetInput } from "../types/set";
import { delay, newSetId, sets } from "./mock-data";

function findSet(id: string): ClassSet {
  const set = sets.find((s) => s.id === id);
  if (!set) throw new Error("Set not found.");
  return set;
}

/** Set codes are unique per subject + semester + school year. */
function codeTaken(
  subjectId: string,
  setCode: string,
  schoolYear: string,
  semester: number,
  excludeId?: string,
): boolean {
  return sets.some(
    (s) =>
      s.id !== excludeId &&
      s.subjectId === subjectId &&
      s.schoolYear === schoolYear &&
      s.semester === semester &&
      s.setCode.toLowerCase() === setCode.trim().toLowerCase(),
  );
}

async function list(): Promise<ClassSet[]> {
  await delay();
  return [...sets];
}

async function create(input: CreateSetInput): Promise<ClassSet> {
  await delay();
  if (codeTaken(input.subjectId, input.setCode, input.schoolYear, input.semester)) {
    throw new Error(
      `Set "${input.setCode}" already exists for this subject in ${input.schoolYear} Sem ${input.semester}.`,
    );
  }
  const set: ClassSet = { id: newSetId(), ...input };
  sets.push(set);
  return set;
}

async function update(id: string, input: UpdateSetInput): Promise<ClassSet> {
  await delay();
  const set = findSet(id);
  const subjectId = input.subjectId ?? set.subjectId;
  const setCode = input.setCode ?? set.setCode;
  const schoolYear = input.schoolYear ?? set.schoolYear;
  const semester = input.semester ?? set.semester;

  if (codeTaken(subjectId, setCode, schoolYear, semester, id)) {
    throw new Error(
      `Set "${setCode}" already exists for this subject in ${schoolYear} Sem ${semester}.`,
    );
  }
  Object.assign(set, input);
  return set;
}

async function remove(id: string): Promise<void> {
  await delay();
  const set = findSet(id);
  sets.splice(sets.indexOf(set), 1);
}

export const setService = {
  list,
  create,
  update,
  remove,
};
