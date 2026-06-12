import type { CreateUserInput, UpdateUserInput, User, UserStatus } from "../types/user";
import { accounts, DEFAULT_PASSWORD, delay, newId, toUser } from "./mock-data";

/** MOCK user management service backed by the shared in-memory store. */

function findAccount(id: string) {
  const account = accounts.find((a) => a.id === id);
  if (!account) throw new Error("User not found.");
  return account;
}

function emailTaken(email: string, excludeId?: string): boolean {
  return accounts.some(
    (a) => a.id !== excludeId && a.email.toLowerCase() === email.toLowerCase(),
  );
}

async function list(): Promise<User[]> {
  await delay();
  return accounts.map(toUser);
}

async function create(input: CreateUserInput): Promise<User> {
  await delay();
  if (emailTaken(input.email)) {
    throw new Error("A user with that email already exists.");
  }

  const record = {
    id: newId(),
    ...input,
    status: "active" as const,
    // New accounts start on the default password and must change it at first login.
    mustChangePassword: true,
    password: DEFAULT_PASSWORD,
  };
  accounts.push(record);
  return toUser(record);
}

async function update(id: string, input: UpdateUserInput): Promise<User> {
  await delay();
  const account = findAccount(id);
  if (input.email && emailTaken(input.email, id)) {
    throw new Error("A user with that email already exists.");
  }

  Object.assign(account, input);
  return toUser(account);
}

async function setStatus(id: string, status: UserStatus): Promise<User> {
  await delay();
  const account = findAccount(id);
  account.status = status;
  return toUser(account);
}

/** Admin reset: back to the default password + forced change at next login. */
async function resetPassword(id: string): Promise<void> {
  await delay();
  const account = findAccount(id);
  account.password = DEFAULT_PASSWORD;
  account.mustChangePassword = true;
}

export const userService = {
  list,
  create,
  update,
  setStatus,
  resetPassword,
};
