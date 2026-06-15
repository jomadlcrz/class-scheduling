import { z } from "zod";

export const studentSchema = z.object({
  firstName: z.string().min(1, "First name and last name are required."),
  lastName: z.string().min(1, "First name and last name are required."),
  studentNumber: z.string().min(1, "Student number is required."),
  email: z.string(),
  program: z.string().min(1, "Please select a program."),
  yearLevel: z.number().int().min(1).max(4),
  setCode: z.string(),
  status: z.enum(["enrolled", "inactive", "graduated"]),
});
