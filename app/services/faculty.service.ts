import type {
  Faculty,
  CreateFacultyInput,
  FacultyStatus,
  UpdateFacultyInput,
} from "~/types/faculty";
import { faculty, delay, newFacultyId } from "~/services/mock-data";

function findFaculty(id: string): Faculty {
  const f = faculty.find((f) => f.id === id);
  if (!f) throw new Error("Faculty not found.");
  return f;
}

function emailTaken(email: string, excludeId?: string): boolean {
  return faculty.some(
    (f) => f.id !== excludeId && f.email.toLowerCase() === email.trim().toLowerCase(),
  );
}

async function list(): Promise<Faculty[]> {
  await delay();
  return [...faculty];
}

async function create(input: CreateFacultyInput): Promise<Faculty> {
  await delay(300);
  if (emailTaken(input.email))
    throw new Error(`Email "${input.email}" is already in use.`);
  const member: Faculty = { id: newFacultyId(), ...input };
  faculty.push(member);
  return member;
}

async function update(id: string, input: UpdateFacultyInput): Promise<Faculty> {
  await delay();
  const member = findFaculty(id);
  if (input.email && emailTaken(input.email, id))
    throw new Error(`Email "${input.email}" is already in use.`);
  Object.assign(member, input);
  return member;
}

async function setStatus(id: string, status: FacultyStatus): Promise<Faculty> {
  await delay();
  const member = findFaculty(id);
  member.status = status;
  return member;
}

export const facultyService = { list, create, update, setStatus };
