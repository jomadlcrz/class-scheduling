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

let idCounter = accounts.length;

export function newId(): string {
  idCounter += 1;
  return `u-${idCounter}`;
}

export function delay(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toUser({ password: _password, ...user }: AccountRecord): User {
  return user;
}
