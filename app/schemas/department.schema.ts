import { z } from "zod";

export const departmentSchema = z.object({
  code: z.string().min(1, "Enter a department code."),
  name: z.string().min(1, "Enter a department name."),
  buildingId: z.string().min(1, "Select a building."),
});
