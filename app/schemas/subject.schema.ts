import { z } from "zod";

export const subjectSchema = z.object({
  code: z.string().min(1, "Enter the subject code."),
  title: z.string().min(1, "Enter the descriptive title."),
  units: z.number().min(1, "Units must be at least 1."),
  subjectType: z.string().min(1, "Select a subject type."),
  prerequisites: z.array(z.string()),
});
