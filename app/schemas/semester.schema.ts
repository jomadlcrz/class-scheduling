import { z } from "zod";

export const semesterSchema = z.object({
  academicYearId: z.string().min(1, "Select an academic year."),
  semester: z.coerce.number().int().min(1).max(3),
  status: z.enum(["upcoming", "active", "completed", "archived"]),
});
