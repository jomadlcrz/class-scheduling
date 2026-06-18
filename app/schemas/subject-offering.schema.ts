import { z } from "zod";

export const subjectOfferingSchema = z.object({
  semesterId: z.string().min(1, "Select a semester."),
  subjectId: z.string().min(1, "Select a subject."),
});
