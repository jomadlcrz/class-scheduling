import { z } from "zod";

export const facultyLoadEntrySchema = z.object({
  facultyKey: z.string().min(1, "Select a faculty member."),
  maxWeeklyHours: z.coerce.number().positive("Enter max weekly hours."),
  programs: z
    .array(
      z.object({
        programId: z.number().int().positive(),
        subjects: z
          .array(z.object({ subjectId: z.number().int().positive() }))
          .min(1),
      }),
    )
    .min(1, "Assign at least one subject."),
});
