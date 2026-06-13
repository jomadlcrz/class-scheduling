import type { Department, CreateDepartmentInput, UpdateDepartmentInput } from "../types/department";
import { departments, delay, newDepartmentId } from "./mock-data";

function findDepartment(id: string): Department {
  const d = departments.find((d) => d.id === id);
  if (!d) throw new Error("Department not found.");
  return d;
}

function codeTaken(code: string, excludeId?: string): boolean {
  return departments.some(
    (d) => d.id !== excludeId && d.code.toLowerCase() === code.trim().toLowerCase(),
  );
}

async function list(): Promise<Department[]> {
  await delay();
  return [...departments];
}

async function create(input: CreateDepartmentInput): Promise<Department> {
  await delay(300);
  if (codeTaken(input.code))
    throw new Error(`Department code "${input.code}" is already in use.`);
  const department: Department = { id: newDepartmentId(), ...input };
  departments.push(department);
  return department;
}

async function update(id: string, input: UpdateDepartmentInput): Promise<Department> {
  await delay();
  const department = findDepartment(id);
  if (input.code && codeTaken(input.code, id))
    throw new Error(`Department code "${input.code}" is already in use.`);
  Object.assign(department, input);
  return department;
}

async function remove(id: string): Promise<void> {
  await delay();
  const department = findDepartment(id);
  departments.splice(departments.indexOf(department), 1);
}

export const departmentService = { list, create, update, remove };
