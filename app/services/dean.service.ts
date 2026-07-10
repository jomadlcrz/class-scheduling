import type { Dean, CreateDeanInput, DeanStatus, UpdateDeanInput } from "~/types/dean";
import { deans, delay, newDeanId } from "~/services/mock-data";

function findDean(id: string): Dean {
  const d = deans.find((d) => d.id === id);
  if (!d) throw new Error("Dean not found.");
  return d;
}

function emailTaken(email: string, excludeId?: string): boolean {
  return deans.some(
    (d) => d.id !== excludeId && d.email.toLowerCase() === email.trim().toLowerCase(),
  );
}

async function list(): Promise<Dean[]> {
  await delay();
  return [...deans];
}

async function create(input: CreateDeanInput): Promise<Dean> {
  await delay(300);
  if (emailTaken(input.email))
    throw new Error(`Email "${input.email}" is already in use.`);
  const member: Dean = { id: newDeanId(), ...input };
  deans.push(member);
  return member;
}

async function update(id: string, input: UpdateDeanInput): Promise<Dean> {
  await delay();
  const member = findDean(id);
  if (input.email && emailTaken(input.email, id))
    throw new Error(`Email "${input.email}" is already in use.`);
  Object.assign(member, input);
  return member;
}

async function setStatus(id: string, status: DeanStatus): Promise<Dean> {
  await delay();
  const member = findDean(id);
  member.status = status;
  return member;
}

export const deanService = { list, create, update, setStatus };
