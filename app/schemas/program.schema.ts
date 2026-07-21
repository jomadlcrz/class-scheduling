import { z } from "zod";

export const programSchema = z.object({
  departmentName: z.string().min(1, "Select a department."),
  abbrev: z.string().min(1, "Enter a program abbreviation."),
  name: z.string().min(1, "Enter a program name."),
  type: z.string().min(1, "Select a program type."),
  lengthYears: z.number().int().min(1, "Enter a valid program length."),
});
