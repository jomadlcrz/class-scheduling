import { z } from "zod";

/** Mirrors the backend create-faculty-accounts contract. Gender and civil
 * status come from the backend enum options and are validated server-side. */
export const facultySchema = z.object({
  firstName: z.string().min(1, "Enter the first name."),
  midName: z.string(),
  lastName: z.string().min(1, "Enter the last name."),
  email: z.email("Enter a valid email address."),
  mobile: z
    .string()
    .regex(/^\d{11}$/, "Enter a valid 11-digit mobile number."),
  departmentId: z.coerce.number().int().positive("Select a department."),
  gender: z.string().min(1, "Select a gender."),
  civilStatus: z.string().min(1, "Select a civil status."),
});

export const facultyFormSchema = z.object({
  firstName: z.string().min(1, "Enter the first name."),
  lastName: z.string().min(1, "Enter the last name."),
  email: z.email("Enter a valid email address."),
  departmentId: z.string().min(1, "Select a department."),
  specialization: z.string(),
  status: z.enum(["active", "inactive"]),
  maxWeeklyHours: z.coerce.number().min(1, "Enter max weekly hours."),
});
