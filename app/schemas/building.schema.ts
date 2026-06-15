import { z } from "zod";

export const buildingSchema = z.object({
  name: z.string().min(1, "Enter a building name."),
  code: z.string().min(1, "Enter a building code."),
  floorCount: z.number().int().min(1, "Enter a valid floor count."),
});
