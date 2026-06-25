export type Role = "admin" | "registrar" | "dean" | "faculty" | "student";

export type UserStatus = "active" | "inactive";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  /** Forces the change-password flow before the app can be used (first login / admin reset). */
  mustChangePassword: boolean;
  /** Links a faculty account to its Faculty record (drives the faculty schedule view). */
  facultyId?: string;
  /** Links a student account to its Student record (drives the student schedule view). */
  studentId?: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  role: Role;
};

export type UpdateUserInput = Partial<CreateUserInput>;
