import type { Administrator, CreateAdministratorAccountInput } from "~/types/administrator";

/**
 * UI-only mock administrator service (in-memory, no backend yet). Swap the
 * internals for real `apiGet`/`apiPost`/`apiPatch`/`apiDelete` calls (see
 * faculty.service.ts) once the backend exposes admin/registrar endpoints —
 * the function signatures below are shaped to match that swap.
 */

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let nextId = 1;
let accounts: Administrator[] = [];

function emailTaken(email: string): boolean {
  return accounts.some((a) => a.email.toLowerCase() === email.toLowerCase());
}

async function list(): Promise<Administrator[]> {
  await delay();
  return [...accounts];
}

async function create(input: CreateAdministratorAccountInput): Promise<string> {
  await delay();
  if (emailTaken(input.email)) {
    throw new Error("An administrator with that email already exists.");
  }

  const record: Administrator = {
    id: nextId++,
    firstName: input.firstName,
    midName: input.midName?.trim() ? input.midName : null,
    lastName: input.lastName,
    email: input.email,
    roleName: input.roleName,
    departmentId: input.roleName === "Registrar Admin" ? (input.departmentId ?? null) : null,
    isActive: true,
    isTemp: true,
  };
  accounts.push(record);
  return `Administrator registered. Login credentials would be emailed to ${input.email}.`;
}

async function resetPassword(id: number): Promise<string> {
  await delay();
  const account = accounts.find((a) => a.id === id);
  if (!account) throw new Error("Administrator not found.");
  account.isTemp = true;
  return `Password reset. New login credentials would be emailed to ${account.email}.`;
}

async function deactivate(id: number): Promise<string> {
  await delay();
  const account = accounts.find((a) => a.id === id);
  if (!account) throw new Error("Administrator not found.");
  account.isActive = false;
  return "Administrator deactivated.";
}

async function reactivate(id: number): Promise<string> {
  await delay();
  const account = accounts.find((a) => a.id === id);
  if (!account) throw new Error("Administrator not found.");
  account.isActive = true;
  return "Administrator restored.";
}

export const administratorService = { list, create, resetPassword, deactivate, reactivate };
