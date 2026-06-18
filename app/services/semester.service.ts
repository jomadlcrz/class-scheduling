import type { AcademicSemester, CreateAcademicSemesterInput, UpdateAcademicSemesterInput } from "../types/semester";
import { academicSemesters, delay, newSemesterId } from "./mock-data";

function find(id: string): AcademicSemester {
  const sem = academicSemesters.find((s) => s.id === id);
  if (!sem) throw new Error("Semester not found.");
  return sem;
}

function duplicate(academicYearId: string, semester: number, excludeId?: string): boolean {
  return academicSemesters.some(
    (s) => s.id !== excludeId && s.academicYearId === academicYearId && s.semester === semester,
  );
}

async function list(academicYearId?: string): Promise<AcademicSemester[]> {
  await delay();
  const all = [...academicSemesters];
  return academicYearId ? all.filter((s) => s.academicYearId === academicYearId) : all;
}

async function create(input: CreateAcademicSemesterInput): Promise<AcademicSemester> {
  await delay(300);
  if (duplicate(input.academicYearId, input.semester))
    throw new Error(`Semester ${input.semester} already exists for this academic year.`);
  const sem: AcademicSemester = { id: newSemesterId(), ...input };
  academicSemesters.push(sem);
  return sem;
}

async function update(id: string, input: UpdateAcademicSemesterInput): Promise<AcademicSemester> {
  await delay();
  const sem = find(id);
  const yearId = input.academicYearId ?? sem.academicYearId;
  const semNum = input.semester ?? sem.semester;
  if ((input.academicYearId || input.semester) && duplicate(yearId, semNum, id))
    throw new Error(`Semester ${semNum} already exists for this academic year.`);
  Object.assign(sem, input);
  return sem;
}

async function remove(id: string): Promise<void> {
  await delay();
  const sem = find(id);
  academicSemesters.splice(academicSemesters.indexOf(sem), 1);
}

export const semesterService = { list, create, update, remove };
