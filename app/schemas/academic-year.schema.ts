import { z } from "zod";

export const academicYearSchema = z.object({
  label: z
    .string()
    .min(1, "Enter an academic year label.")
    .regex(/^\d{4}-\d{4}$/, "Format must be YYYY-YYYY (e.g., 2025-2026)."),
  status: z.enum(["active", "upcoming", "archived"]),
});
