import type { CreateSubjectInput, Subject, UpdateSubjectInput } from "~/types/subject";

/** MOCK curriculum subject service backed by the shared in-memory store. */

function findSubject(id: string): Subject {
  const subject = subjects.find((s) => s.id === id);
  if (!subject) throw new Error("Subject not found.");
  return subject;
}

/** Codes are unique within a program; other programs may reuse them. */
function codeTaken(code: string, program: string, excludeId?: string): boolean {
  return subjects.some(
    (s) =>
      s.id !== excludeId &&
      s.program === program &&
      s.code.toLowerCase() === code.toLowerCase(),
  );
}

function assertValidPrerequisites(
  prerequisiteIds: string[],
  program: string,
  selfId?: string,
) {
  for (const id of prerequisiteIds) {
    if (id === selfId) {
      throw new Error("A subject cannot be its own prerequisite.");
    }
    const prerequisite = subjects.find((s) => s.id === id);
    if (!prerequisite || prerequisite.program !== program) {
      throw new Error("Prerequisites must be subjects from the same program.");
    }
  }
}

async function list(): Promise<Subject[]> {
  await delay();
  return [...subjects];
}

async function create(input: CreateSubjectInput): Promise<Subject> {
  await delay();
  if (codeTaken(input.code, input.program)) {
    throw new Error(`A subject with the code ${input.code} already exists in ${input.program}.`);
  }
  assertValidPrerequisites(input.prerequisiteIds, input.program);

  const subject: Subject = { id: newSubjectId(), ...input };
  subjects.push(subject);
  return subject;
}

async function update(id: string, input: UpdateSubjectInput): Promise<Subject> {
  await delay();
  const subject = findSubject(id);
  const program = input.program ?? subject.program;
  const code = input.code ?? subject.code;

  if (codeTaken(code, program, id)) {
    throw new Error(`A subject with the code ${code} already exists in ${program}.`);
  }
  assertValidPrerequisites(input.prerequisiteIds ?? subject.prerequisiteIds, program, id);

  Object.assign(subject, input);
  return subject;
}

async function remove(id: string): Promise<void> {
  await delay();
  const subject = findSubject(id);

  const dependents = subjects.filter((s) => s.prerequisiteIds.includes(id));
  if (dependents.length > 0) {
    throw new Error(
      `Cannot delete ${subject.code} — it is a prerequisite of ${dependents
        .map((s) => s.code)
        .join(", ")}.`,
    );
  }

  subjects.splice(subjects.indexOf(subject), 1);
}

export const subjectService = {
  list,
  create,
  update,
  remove,
};
