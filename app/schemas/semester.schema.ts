import { z } from "zod";

export const semesterSchema = z.object({
  semester: z
    .string()
    .min(1, "Enter the semester name.")
    .max(20, "Semester name must be at most 20 characters."),
  semesterNumber: z.coerce.number().int().min(1).max(3),
});
