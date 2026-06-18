import type { CreateSubjectOfferingInput, SubjectOffering, UpdateSubjectOfferingInput } from "../types/subject-offering";
import { delay, newOfferingId, subjectOfferings } from "./mock-data";

function find(id: string): SubjectOffering {
  const off = subjectOfferings.find((o) => o.id === id);
  if (!off) throw new Error("Subject offering not found.");
  return off;
}

function duplicate(semesterId: string, subjectId: string, excludeId?: string): boolean {
  return subjectOfferings.some(
    (o) => o.id !== excludeId && o.semesterId === semesterId && o.subjectId === subjectId,
  );
}

async function list(semesterId?: string): Promise<SubjectOffering[]> {
  await delay();
  const all = [...subjectOfferings];
  return semesterId ? all.filter((o) => o.semesterId === semesterId) : all;
}

async function create(input: CreateSubjectOfferingInput): Promise<SubjectOffering> {
  await delay(300);
  if (duplicate(input.semesterId, input.subjectId))
    throw new Error(`"${input.subjectCode}" is already offered in this semester.`);
  const off: SubjectOffering = { id: newOfferingId(), ...input };
  subjectOfferings.push(off);
  return off;
}

async function update(id: string, input: UpdateSubjectOfferingInput): Promise<SubjectOffering> {
  await delay();
  const off = find(id);
  const newSubjectId = input.subjectId ?? off.subjectId;
  if (input.subjectId && newSubjectId !== off.subjectId && duplicate(off.semesterId, newSubjectId, id))
    throw new Error(`"${input.subjectCode}" is already offered in this semester.`);
  Object.assign(off, input);
  return off;
}

async function remove(id: string): Promise<void> {
  await delay();
  const off = find(id);
  subjectOfferings.splice(subjectOfferings.indexOf(off), 1);
}

export const subjectOfferingService = { list, create, update, remove };
