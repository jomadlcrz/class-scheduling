import type { AcademicYear, CreateAcademicYearInput, UpdateAcademicYearInput } from "../types/academic-year";
import { academicYears, delay, newAcademicYearId } from "./mock-data";

function find(id: string): AcademicYear {
  const ay = academicYears.find((a) => a.id === id);
  if (!ay) throw new Error("Academic year not found.");
  return ay;
}

function labelTaken(label: string, excludeId?: string): boolean {
  return academicYears.some(
    (a) => a.id !== excludeId && a.label.toLowerCase() === label.trim().toLowerCase(),
  );
}

async function list(): Promise<AcademicYear[]> {
  await delay();
  return [...academicYears];
}

async function create(input: CreateAcademicYearInput): Promise<AcademicYear> {
  await delay(300);
  if (labelTaken(input.label))
    throw new Error(`Academic year "${input.label}" already exists.`);
  const ay: AcademicYear = { id: newAcademicYearId(), ...input };
  academicYears.push(ay);
  return ay;
}

async function update(id: string, input: UpdateAcademicYearInput): Promise<AcademicYear> {
  await delay();
  const ay = find(id);
  if (input.label && labelTaken(input.label, id))
    throw new Error(`Academic year "${input.label}" already exists.`);
  Object.assign(ay, input);
  return ay;
}

async function remove(id: string): Promise<void> {
  await delay();
  const ay = find(id);
  academicYears.splice(academicYears.indexOf(ay), 1);
}

export const academicYearService = { list, create, update, remove };
