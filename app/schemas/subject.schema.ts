import { z } from "zod";

export const subjectSchema = z.object({
  code: z.string().min(1, "Enter the subject code."),
  title: z.string().min(1, "Enter the descriptive title."),
  units: z.number().min(1, "Units must be at least 1."),
  lectureHours: z.number().min(0, "Hours can't be negative."),
  labHours: z.number().min(0, "Hours can't be negative."),
  program: z.string(),
  yearLevel: z.number().int().min(1).max(4),
  semester: z.number().int().min(1).max(3),
  subjectType: z.enum(["gened", "major-lab", "major", "minor", "research"]),
  prerequisiteIds: z.array(z.string()),
});
