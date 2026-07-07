import type { Program, CreateProgramInput, UpdateProgramInput } from "~/types/program";
import { programs, delay, newProgramId } from "~/services/mock-data";

function findProgram(id: string): Program {
  const p = programs.find((p) => p.id === id);
  if (!p) throw new Error("Program not found.");
  return p;
}

function codeTaken(code: string, excludeId?: string): boolean {
  return programs.some(
    (p) => p.id !== excludeId && p.code.toLowerCase() === code.trim().toLowerCase(),
  );
}

async function list(): Promise<Program[]> {
  await delay();
  return [...programs];
}

async function create(input: CreateProgramInput): Promise<Program> {
  await delay(300);
  if (codeTaken(input.code))
    throw new Error(`Program code "${input.code}" is already in use.`);
  const program: Program = { id: newProgramId(), ...input };
  programs.push(program);
  return program;
}

async function update(id: string, input: UpdateProgramInput): Promise<Program> {
  await delay();
  const program = findProgram(id);
  if (input.code && codeTaken(input.code, id))
    throw new Error(`Program code "${input.code}" is already in use.`);
  Object.assign(program, input);
  return program;
}

async function remove(id: string): Promise<void> {
  await delay();
  const program = findProgram(id);
  programs.splice(programs.indexOf(program), 1);
}

export const programService = { list, create, update, remove };
