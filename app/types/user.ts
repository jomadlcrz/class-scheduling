export type Role = "admin" | "registrar" | "dean" | "faculty";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Forces the change-password flow before the app can be used (first login / admin reset). */
  mustChangePassword: boolean;
};
