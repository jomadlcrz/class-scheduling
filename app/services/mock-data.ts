import type { Building } from "../types/building";
import type { Department } from "../types/department";
import type { Program } from "../types/program";
import type { Room } from "../types/room";
import type { ClassSet } from "../types/set";
import type { Subject } from "../types/subject";
import type { User } from "../types/user";

/**
 * Shared in-memory store for all mock services — resets on reload.
 * Auth and user management read the same records, so deactivating a
 * user here really blocks their login.
 *
 * Demo accounts (password after the colon):
 *   admin@gwc.edu.ph     : admin12345
 *   registrar@gwc.edu.ph : registrar12345
 *   dean@gwc.edu.ph      : dean12345
 *   faculty@gwc.edu.ph   : faculty12345   (forced change-password on first login)
 *   student@gwc.edu.ph   : student12345
 */

export type AccountRecord = User & { password: string };

/** Password assigned to admin-created accounts and admin resets. */
export const DEFAULT_PASSWORD = "gwc-temp-12345";

export const accounts: AccountRecord[] = [
  {
    id: "u-1",
    name: "Alma Reyes",
    email: "admin@gwc.edu.ph",
    role: "admin",
    status: "active",
    mustChangePassword: false,
    password: "admin12345",
  },
  {
    id: "u-2",
    name: "Bea Santos",
    email: "registrar@gwc.edu.ph",
    role: "registrar",
    status: "active",
    mustChangePassword: false,
    password: "registrar12345",
  },
  {
    id: "u-3",
    name: "Carlo Dizon",
    email: "faculty@gwc.edu.ph",
    role: "faculty",
    status: "active",
    mustChangePassword: true,
    password: "faculty12345",
  },
  {
    id: "u-4",
    name: "Diego Ramos",
    email: "dean@gwc.edu.ph",
    role: "dean",
    status: "active",
    mustChangePassword: false,
    password: "dean12345",
  },
  {
    id: "u-5",
    name: "Elena Cruz",
    email: "e.cruz@gwc.edu.ph",
    role: "faculty",
    status: "active",
    mustChangePassword: false,
    password: DEFAULT_PASSWORD,
  },
  {
    id: "u-6",
    name: "Faye Aquino",
    email: "f.aquino@gwc.edu.ph",
    role: "faculty",
    status: "inactive",
    mustChangePassword: false,
    password: DEFAULT_PASSWORD,
  },
  {
    id: "u-7",
    name: "Gio Mendoza",
    email: "student@gwc.edu.ph",
    role: "student",
    status: "active",
    mustChangePassword: false,
    password: "student12345",
  },
  {
    id: "u-8",
    name: "Hana Lim",
    email: "h.lim@gwc.edu.ph",
    role: "student",
    status: "active",
    mustChangePassword: false,
    password: DEFAULT_PASSWORD,
  },
  {
    id: "u-9",
    name: "Ivan Torres",
    email: "i.torres@gwc.edu.ph",
    role: "student",
    status: "active",
    mustChangePassword: false,
    password: DEFAULT_PASSWORD,
  },
];

// ─── Buildings ──────────────────────────────────────────────────────────────

export const buildings: Building[] = [
  { id: "bldg-1", name: "Main Building", code: "MB", floorCount: 3 },
  { id: "bldg-2", name: "Science and Technology Building", code: "STB", floorCount: 4 },
  { id: "bldg-3", name: "Business Administration Building", code: "BAB", floorCount: 3 },
];

let buildingIdCounter = buildings.length;

export function newBuildingId(): string {
  buildingIdCounter += 1;
  return `bldg-${buildingIdCounter}`;
}

// ─── Rooms ──────────────────────────────────────────────────────────────────

export const rooms: Room[] = [
  { id: "r-1", buildingId: "bldg-1", buildingCode: "MB", floor: 1, name: "Room 101", capacity: 40, type: "lecture", status: "vacant" },
  { id: "r-2", buildingId: "bldg-1", buildingCode: "MB", floor: 1, name: "Room 102", capacity: 40, type: "lecture", status: "occupied" },
  { id: "r-3", buildingId: "bldg-1", buildingCode: "MB", floor: 2, name: "Room 201", capacity: 35, type: "lecture", status: "vacant" },
  { id: "r-4", buildingId: "bldg-2", buildingCode: "STB", floor: 1, name: "Lab 101", capacity: 30, type: "laboratory", status: "vacant" },
  { id: "r-5", buildingId: "bldg-2", buildingCode: "STB", floor: 1, name: "Lab 102", capacity: 30, type: "laboratory", status: "maintenance" },
  { id: "r-6", buildingId: "bldg-2", buildingCode: "STB", floor: 2, name: "Room 201", capacity: 40, type: "lecture", status: "vacant" },
  { id: "r-7", buildingId: "bldg-3", buildingCode: "BAB", floor: 1, name: "Room 101", capacity: 40, type: "lecture", status: "vacant" },
  { id: "r-8", buildingId: "bldg-3", buildingCode: "BAB", floor: 2, name: "Room 201", capacity: 35, type: "lecture", status: "occupied" },
];

let roomIdCounter = rooms.length;

export function newRoomId(): string {
  roomIdCounter += 1;
  return `r-${roomIdCounter}`;
}

// ─── Departments ─────────────────────────────────────────────────────────────

export const departments: Department[] = [
  { id: "dept-1", code: "CITE", name: "College of Information Technology Education", buildingId: "bldg-2", buildingCode: "STB" },
  { id: "dept-2", code: "CBA", name: "College of Business Administration", buildingId: "bldg-3", buildingCode: "BAB" },
  { id: "dept-3", code: "COEd", name: "College of Education", buildingId: "bldg-1", buildingCode: "MB" },
];

let departmentIdCounter = departments.length;

export function newDepartmentId(): string {
  departmentIdCounter += 1;
  return `dept-${departmentIdCounter}`;
}

// ─── Programs ────────────────────────────────────────────────────────────────

export const programs: Program[] = [
  { id: "prog-1", departmentId: "dept-1", departmentCode: "CITE", code: "BSIS", name: "Bachelor of Science in Information Systems", type: "bachelor", lengthYears: 4 },
  { id: "prog-2", departmentId: "dept-1", departmentCode: "CITE", code: "BSCS", name: "Bachelor of Science in Computer Science", type: "bachelor", lengthYears: 4 },
  { id: "prog-3", departmentId: "dept-2", departmentCode: "CBA", code: "BSBA", name: "Bachelor of Science in Business Administration", type: "bachelor", lengthYears: 4 },
  { id: "prog-4", departmentId: "dept-3", departmentCode: "COEd", code: "BSED", name: "Bachelor of Secondary Education", type: "bachelor", lengthYears: 4 },
];

/** Alias for backward-compatible imports — same mutable reference as programs[]. */
export const PROGRAMS = programs;

let programIdCounter = programs.length;

export function newProgramId(): string {
  programIdCounter += 1;
  return `prog-${programIdCounter}`;
}

// ─── Subjects ────────────────────────────────────────────────────────────────

export const subjects: Subject[] = [
  {
    id: "s-1",
    program: "BSIS",
    yearLevel: 1,
    semester: 1,
    code: "CS 101",
    title: "Introduction to Computing",
    units: 3,
    lectureHours: 2,
    labHours: 3,
    subjectType: "major-lab",
    prerequisiteIds: [],
  },
  {
    id: "s-2",
    program: "BSIS",
    yearLevel: 1,
    semester: 2,
    code: "CS 102",
    title: "Computer Programming 1",
    units: 3,
    lectureHours: 2,
    labHours: 3,
    subjectType: "major-lab",
    prerequisiteIds: ["s-1"],
  },
  {
    id: "s-3",
    program: "BSIS",
    yearLevel: 2,
    semester: 1,
    code: "CS 201",
    title: "Data Structures and Algorithms",
    units: 3,
    lectureHours: 2,
    labHours: 3,
    subjectType: "major-lab",
    prerequisiteIds: ["s-2"],
  },
  {
    id: "s-4",
    program: "BSIS",
    yearLevel: 1,
    semester: 1,
    code: "MATH 101",
    title: "College Algebra",
    units: 3,
    lectureHours: 3,
    labHours: 0,
    subjectType: "gened",
    prerequisiteIds: [],
  },
  {
    id: "s-5",
    program: "BSIS",
    yearLevel: 1,
    semester: 1,
    code: "ENG 101",
    title: "Purposive Communication",
    units: 3,
    lectureHours: 3,
    labHours: 0,
    subjectType: "gened",
    prerequisiteIds: [],
  },
  {
    id: "s-6",
    program: "BSIS",
    yearLevel: 1,
    semester: 2,
    code: "FIL 101",
    title: "Komunikasyon sa Akademikong Filipino",
    units: 3,
    lectureHours: 3,
    labHours: 0,
    subjectType: "gened",
    prerequisiteIds: [],
  },
  {
    id: "s-7",
    program: "BSIS",
    yearLevel: 1,
    semester: 1,
    code: "PE 101",
    title: "Physical Fitness and Wellness",
    units: 2,
    lectureHours: 2,
    labHours: 0,
    subjectType: "minor",
    prerequisiteIds: [],
  },
  {
    id: "s-8",
    program: "BSBA",
    yearLevel: 1,
    semester: 1,
    code: "ACCTG 101",
    title: "Fundamentals of Accounting",
    units: 3,
    lectureHours: 3,
    labHours: 0,
    subjectType: "major",
    prerequisiteIds: [],
  },
  {
    id: "s-9",
    program: "BSCS",
    yearLevel: 1,
    semester: 1,
    code: "CS 101",
    title: "Introduction to Computing",
    units: 3,
    lectureHours: 2,
    labHours: 3,
    subjectType: "major-lab",
    prerequisiteIds: [],
  },
];

// ─── Sets ─────────────────────────────────────────────────────────────────────

export const sets: ClassSet[] = [
  { id: "set-1", program: "BSIS", yearLevel: 1, setCode: "A" },
  { id: "set-2", program: "BSIS", yearLevel: 1, setCode: "B" },
  { id: "set-3", program: "BSIS", yearLevel: 2, setCode: "A" },
  { id: "set-4", program: "BSIS", yearLevel: 2, setCode: "B" },
  { id: "set-5", program: "BSCS", yearLevel: 1, setCode: "A" },
  { id: "set-6", program: "BSBA", yearLevel: 1, setCode: "A" },
];

let setIdCounter = sets.length;

export function newSetId(): string {
  setIdCounter += 1;
  return `set-${setIdCounter}`;
}

// ─── Users ────────────────────────────────────────────────────────────────────

let idCounter = accounts.length;

export function newId(): string {
  idCounter += 1;
  return `u-${idCounter}`;
}

let subjectIdCounter = subjects.length;

export function newSubjectId(): string {
  subjectIdCounter += 1;
  return `s-${subjectIdCounter}`;
}

export function delay(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toUser({ password: _password, ...user }: AccountRecord): User {
  return user;
}
