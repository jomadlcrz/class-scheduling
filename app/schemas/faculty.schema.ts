import { z } from "zod";
import { CIVIL_STATUSES, GENDERS } from "~/types/faculty";

/** Mirrors the backend create-faculty-accounts contract. */
export const facultyAccountSchema = z.object({
  firstName: z.string().min(1, "Enter the first name."),
  midName: z.string(),
  lastName: z.string().min(1, "Enter the last name."),
  email: z.email("Enter a valid email address."),
  mobile: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Enter a valid mobile number (7–15 digits, optional leading +)."),
  departmentId: z.coerce.number().int().positive("Select a department."),
  gender: z.enum(GENDERS),
  civilStatus: z.enum(CIVIL_STATUSES),
});

export const facultySchema = z.object({
  firstName: z.string().min(1, "Enter the first name."),
  lastName: z.string().min(1, "Enter the last name."),
  email: z.email("Enter a valid email address."),
  departmentId: z.string().min(1, "Select a department."),
  specialization: z.string(),
  status: z.enum(["active", "inactive"]),
  maxWeeklyHours: z.coerce.number().min(1, "Enter max weekly hours."),
});
