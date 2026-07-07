import type { CreateStudentInput, Student, UpdateStudentInput } from "~/types/student";
import { delay, newStudentId, students } from "~/services/mock-data";

function findStudent(id: string): Student {
  const s = students.find((s) => s.id === id);
  if (!s) throw new Error("Student not found.");
  return s;
}

function numberTaken(studentNumber: string, excludeId?: string): boolean {
  return students.some(
    (s) => s.id !== excludeId && s.studentNumber === studentNumber.trim(),
  );
}

async function list(): Promise<Student[]> {
  await delay();
  return [...students];
}

async function create(input: CreateStudentInput): Promise<Student> {
  await delay(300);
  if (numberTaken(input.studentNumber)) {
    throw new Error(`Student number "${input.studentNumber}" is already in use.`);
  }
  const student: Student = { id: newStudentId(), ...input };
  students.push(student);
  return student;
}

async function update(id: string, input: UpdateStudentInput): Promise<Student> {
  await delay();
  const student = findStudent(id);
  if (input.studentNumber && numberTaken(input.studentNumber, id)) {
    throw new Error(`Student number "${input.studentNumber}" is already in use.`);
  }
  Object.assign(student, input);
  return student;
}

async function remove(id: string): Promise<void> {
  await delay();
  const student = findStudent(id);
  students.splice(students.indexOf(student), 1);
}

export const studentService = { list, create, update, remove };
