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

export type Program = {
  /** Short code, e.g. "BSIS". */
  code: string;
  name: string;
};

export const PROGRAMS: Program[] = [
  { code: "BSIS", name: "Bachelor of Science in Information Systems" },
  { code: "BSCS", name: "Bachelor of Science in Computer Science" },
  { code: "BSBA", name: "Bachelor of Science in Business Administration" },
  { code: "BSED", name: "Bachelor of Secondary Education" },
];

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

export const sets: ClassSet[] = [
  {
    id: "set-1",
    subjectId: "s-1",
    setCode: "A",
    schoolYear: "2024-2025",
    semester: 1,
    capacity: 40,
    status: "open",
  },
  {
    id: "set-2",
    subjectId: "s-1",
    setCode: "B",
    schoolYear: "2024-2025",
    semester: 1,
    capacity: 40,
    status: "open",
  },
  {
    id: "set-3",
    subjectId: "s-4",
    setCode: "A",
    schoolYear: "2024-2025",
    semester: 1,
    capacity: 35,
    status: "open",
  },
  {
    id: "set-4",
    subjectId: "s-2",
    setCode: "A",
    schoolYear: "2024-2025",
    semester: 2,
    capacity: 40,
    status: "closed",
  },
  {
    id: "set-5",
    subjectId: "s-9",
    setCode: "A",
    schoolYear: "2024-2025",
    semester: 1,
    capacity: 30,
    status: "open",
  },
];

let setIdCounter = sets.length;

export function newSetId(): string {
  setIdCounter += 1;
  return `set-${setIdCounter}`;
}

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
