import { z } from "zod";

export const departmentSchema = z.object({
  abbrev: z.string().min(1, "Enter a department abbreviation."),
  name: z.string().min(1, "Enter a department name."),
  buildingId: z.coerce.number().int().positive("Select a building."),
  departmentType: z.string().min(1, "Select a department type."),
});
