import { z } from "zod";

export const schoolYearSchema = z
  .object({
    schoolYear: z.string().regex(/^\d{4}-\d{4}$/, "Enter a school year like 2025-2026."),
  })
  .refine(
    ({ schoolYear }) => {
      const [start, end] = schoolYear.split("-").map(Number);
      return end === start + 1;
    },
    { message: "The end year must be one year after the start year.", path: ["schoolYear"] },
  );
