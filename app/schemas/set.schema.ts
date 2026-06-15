import { z } from "zod";

export const setSchema = z.object({
  program: z.string().min(1, "Select a program."),
  yearLevel: z.number().int().min(1).max(4),
  codes: z.array(z.string()).min(1, "Enter at least one set code."),
});
