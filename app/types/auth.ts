import type { User } from "~/types/user";

export type LoginCredentials = {
  email: string;
  password: string;
  /** Persist the session across browser restarts (localStorage vs sessionStorage). */
  remember?: boolean;
};

export type AuthSession = {
  token: string;
  user: User;
};
