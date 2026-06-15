import { z } from "zod";

export const programSchema = z.object({
  departmentId: z.string().min(1, "Select a department."),
  code: z.string().min(1, "Enter a program code."),
  name: z.string().min(1, "Enter a program name."),
  type: z.enum(["bachelor", "associate"]),
  lengthYears: z.number().int().min(1, "Enter a valid program length."),
});
