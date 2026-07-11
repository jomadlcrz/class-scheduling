import { z } from "zod";

export const FACULTY_ROLES = ["Dean", "Faculty"] as const;

export const facultySchema = z.object({
  firstName: z.string().min(1, "Enter the first name."),
  midName: z.string(),
  lastName: z.string().min(1, "Enter the last name."),
  email: z.email("Enter a valid email address."),
  mobile: z
    .string()
    .regex(/^\d{11}$/, "Enter a valid 11-digit mobile number."),
  departmentId: z.coerce.number().int().positive("Select a department."),
  roleName: z.enum(FACULTY_ROLES, { message: "Select a role." }),
  gender: z.string().min(1, "Select a gender."),
  civilStatus: z.string().min(1, "Select a civil status."),
});
