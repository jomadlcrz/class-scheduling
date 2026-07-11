import type { ClassSet, CreateSetInput, UpdateSetInput } from "~/types/set";

function findSet(id: string): ClassSet {
  const set = sets.find((s) => s.id === id);
  if (!set) throw new Error("Set not found.");
  return set;
}

/** Set codes are unique per program + year level. */
function codeTaken(
  program: string,
  yearLevel: number,
  setCode: string,
  excludeId?: string,
): boolean {
  return sets.some(
    (s) =>
      s.id !== excludeId &&
      s.program === program &&
      s.yearLevel === yearLevel &&
      s.setCode.toLowerCase() === setCode.trim().toLowerCase(),
  );
}

async function list(): Promise<ClassSet[]> {
  await delay();
  return [...sets];
}

async function create(input: CreateSetInput): Promise<ClassSet> {
  await delay(300);
  if (codeTaken(input.program, input.yearLevel, input.setCode)) {
    throw new Error(
      `Set "${input.setCode}" already exists for ${input.program} Year ${input.yearLevel}.`,
    );
  }
  const set: ClassSet = { id: newSetId(), ...input };
  sets.push(set);
  return set;
}

async function update(id: string, input: UpdateSetInput): Promise<ClassSet> {
  await delay();
  const set = findSet(id);
  const program = input.program ?? set.program;
  const yearLevel = input.yearLevel ?? set.yearLevel;
  const setCode = input.setCode ?? set.setCode;

  if (codeTaken(program, yearLevel, setCode, id)) {
    throw new Error(
      `Set "${setCode}" already exists for ${program} Year ${yearLevel}.`,
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
