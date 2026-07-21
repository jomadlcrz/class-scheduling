import { z } from "zod";

export const semesterSchema = z.object({
  semester: z.string().min(1, "Enter a semester name.").max(20, "Keep it under 20 characters."),
  semesterNumber: z.number().int().min(1).max(3, "Semester number must be between 1 and 3."),
});
