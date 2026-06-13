import type { Building } from "../types/building";
import type { Department } from "../types/department";
import type { Faculty } from "../types/faculty";
import type { Program } from "../types/program";
import type { Room } from "../types/room";
import type { Schedule } from "../types/schedule";
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
  { id: "bldg-1", name: "Main Building", code: "MB", floorCount: 4 },
  { id: "bldg-2", name: "SHS Building", code: "SHS", floorCount: 3 },
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
  { id: "r-4", buildingId: "bldg-1", buildingCode: "MB", floor: 2, name: "Room 202", capacity: 35, type: "lecture", status: "vacant" },
  { id: "r-5", buildingId: "bldg-2", buildingCode: "SHS", floor: 1, name: "Lab 101", capacity: 30, type: "laboratory", status: "vacant" },
  { id: "r-6", buildingId: "bldg-2", buildingCode: "SHS", floor: 1, name: "Lab 102", capacity: 30, type: "laboratory", status: "maintenance" },
  { id: "r-7", buildingId: "bldg-2", buildingCode: "SHS", floor: 2, name: "Room 201", capacity: 40, type: "lecture", status: "vacant" },
  { id: "r-8", buildingId: "bldg-2", buildingCode: "SHS", floor: 2, name: "Room 202", capacity: 40, type: "lecture", status: "occupied" },
];

let roomIdCounter = rooms.length;

export function newRoomId(): string {
  roomIdCounter += 1;
  return `r-${roomIdCounter}`;
}

// ─── Departments ─────────────────────────────────────────────────────────────

export const departments: Department[] = [
  { id: "dept-1", code: "CITE", name: "College of Information Technology Education", buildingId: "bldg-2", buildingCode: "SHS" },
  { id: "dept-2", code: "CBA", name: "College of Business Administration", buildingId: "bldg-1", buildingCode: "MB" },
  { id: "dept-3", code: "COEd", name: "College of Education", buildingId: "bldg-1", buildingCode: "MB" },
  { id: "dept-4", code: "COC", name: "College of Criminology", buildingId: "bldg-1", buildingCode: "MB" },
];

let departmentIdCounter = departments.length;

export function newDepartmentId(): string {
  departmentIdCounter += 1;
  return `dept-${departmentIdCounter}`;
}

// ─── Programs ────────────────────────────────────────────────────────────────

export const programs: Program[] = [
  // CITE
  { id: "prog-1", departmentId: "dept-1", departmentCode: "CITE", code: "BSIT", name: "Bachelor of Science in Information Technology", type: "bachelor", lengthYears: 4 },
  { id: "prog-2", departmentId: "dept-1", departmentCode: "CITE", code: "ACS", name: "Associate in Computer Science", type: "associate", lengthYears: 2 },
  { id: "prog-3", departmentId: "dept-1", departmentCode: "CITE", code: "BSCS", name: "Bachelor of Science in Computer Science", type: "bachelor", lengthYears: 4 },
  // COC
  { id: "prog-4", departmentId: "dept-4", departmentCode: "COC", code: "BSCRIM", name: "Bachelor of Science in Criminology", type: "bachelor", lengthYears: 4 },
  // CBA
  { id: "prog-5", departmentId: "dept-2", departmentCode: "CBA", code: "BSBA", name: "Bachelor of Science in Business Administration", type: "bachelor", lengthYears: 4 },
  // COEd
  { id: "prog-6", departmentId: "dept-3", departmentCode: "COEd", code: "BEED", name: "Bachelor of Elementary Education", type: "bachelor", lengthYears: 4 },
  { id: "prog-7", departmentId: "dept-3", departmentCode: "COEd", code: "BSED", name: "Bachelor of Secondary Education", type: "bachelor", lengthYears: 4 },
];

/** Alias for backward-compatible imports — same mutable reference as programs[]. */
export const PROGRAMS = programs;

let programIdCounter = programs.length;

export function newProgramId(): string {
  programIdCounter += 1;
  return `prog-${programIdCounter}`;
}

// ─── Faculty ─────────────────────────────────────────────────────────────────

export const faculty: Faculty[] = [
  { id: "fac-1", firstName: "Ana", lastName: "Reyes", email: "a.reyes@gwc.edu.ph", departmentId: "dept-1", departmentCode: "CITE", specialization: "Web Development", status: "active" },
  { id: "fac-2", firstName: "Ben", lastName: "Santos", email: "b.santos@gwc.edu.ph", departmentId: "dept-1", departmentCode: "CITE", specialization: "Data Science", status: "active" },
  { id: "fac-3", firstName: "Clara", lastName: "Dizon", email: "c.dizon@gwc.edu.ph", departmentId: "dept-2", departmentCode: "CBA", specialization: "Business Management", status: "active" },
  { id: "fac-4", firstName: "David", lastName: "Ramos", email: "d.ramos@gwc.edu.ph", departmentId: "dept-3", departmentCode: "COEd", specialization: "Elementary Education", status: "inactive" },
  { id: "fac-5", firstName: "Eva", lastName: "Cruz", email: "ev.cruz@gwc.edu.ph", departmentId: "dept-4", departmentCode: "COC", specialization: "Criminal Law", status: "active" },
  { id: "fac-6", firstName: "Felix", lastName: "Lim", email: "f.lim@gwc.edu.ph", departmentId: "dept-1", departmentCode: "CITE", specialization: "Computer Networks", status: "active" },
];

let facultyIdCounter = faculty.length;

export function newFacultyId(): string {
  facultyIdCounter += 1;
  return `fac-${facultyIdCounter}`;
}

// ─── Subjects ────────────────────────────────────────────────────────────────

export const subjects: Subject[] = [
  {
    id: "s-1",
    program: "BSIT",
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
    program: "BSIT",
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
    program: "BSIT",
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
    program: "BSIT",
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
    program: "BSIT",
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
    program: "BSIT",
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
    program: "BSIT",
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

// ─── Schedules ───────────────────────────────────────────────────────────────

export const schedules: Schedule[] = [
  { id: "sch-1", schoolYear: "2025-2026", semester: 1, subjectId: "s-1", subjectCode: "CS 101", subjectTitle: "Introduction to Computing", setId: "set-1", setCode: "A", program: "BSIT", yearLevel: 1, facultyId: "fac-1", facultyName: "Ana Reyes", roomId: "r-5", roomName: "Lab 101", buildingCode: "SHS", day: "M", startTime: "07:00", endTime: "10:00" },
  { id: "sch-2", schoolYear: "2025-2026", semester: 1, subjectId: "s-4", subjectCode: "MATH 101", subjectTitle: "College Algebra", setId: "set-1", setCode: "A", program: "BSIT", yearLevel: 1, facultyId: "fac-2", facultyName: "Ben Santos", roomId: "r-1", roomName: "Room 101", buildingCode: "MB", day: "T", startTime: "07:00", endTime: "10:00" },
  { id: "sch-3", schoolYear: "2025-2026", semester: 1, subjectId: "s-5", subjectCode: "ENG 101", subjectTitle: "Purposive Communication", setId: "set-1", setCode: "A", program: "BSIT", yearLevel: 1, facultyId: "fac-6", facultyName: "Felix Lim", roomId: "r-1", roomName: "Room 101", buildingCode: "MB", day: "W", startTime: "07:00", endTime: "10:00" },
  { id: "sch-4", schoolYear: "2025-2026", semester: 1, subjectId: "s-1", subjectCode: "CS 101", subjectTitle: "Introduction to Computing", setId: "set-2", setCode: "B", program: "BSIT", yearLevel: 1, facultyId: "fac-1", facultyName: "Ana Reyes", roomId: "r-5", roomName: "Lab 101", buildingCode: "SHS", day: "M", startTime: "10:00", endTime: "13:00" },
  { id: "sch-5", schoolYear: "2025-2026", semester: 1, subjectId: "s-8", subjectCode: "ACCTG 101", subjectTitle: "Fundamentals of Accounting", setId: "set-6", setCode: "A", program: "BSBA", yearLevel: 1, facultyId: "fac-3", facultyName: "Clara Dizon", roomId: "r-3", roomName: "Room 201", buildingCode: "MB", day: "Th", startTime: "07:00", endTime: "10:00" },
];

let scheduleIdCounter = schedules.length;

export function newScheduleId(): string {
  scheduleIdCounter += 1;
  return `sch-${scheduleIdCounter}`;
}

// ─── Sets ─────────────────────────────────────────────────────────────────────

export const sets: ClassSet[] = [
  { id: "set-1", program: "BSIT", yearLevel: 1, setCode: "A" },
  { id: "set-2", program: "BSIT", yearLevel: 1, setCode: "B" },
  { id: "set-3", program: "BSIT", yearLevel: 2, setCode: "A" },
  { id: "set-4", program: "BSIT", yearLevel: 2, setCode: "B" },
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
