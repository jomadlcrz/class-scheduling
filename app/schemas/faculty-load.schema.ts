import { z } from "zod";

export const facultyLoadEntrySchema = z.object({
  facultyKey: z.string().min(1, "Select a faculty member."),
  maxDailyHours: z.coerce.number().positive("Enter max daily hours."),
  maxWeeklyHours: z.coerce.number().positive("Enter max weekly hours."),
  programs: z
    .array(
      z.object({
        programAbbrev: z.string().min(1),
        subjects: z
          .array(z.object({ subjectCode: z.string().min(1), descriptiveTitle: z.string().min(1) }))
          .min(1),
      }),
    )
    .min(1, "Assign at least one subject."),
});
