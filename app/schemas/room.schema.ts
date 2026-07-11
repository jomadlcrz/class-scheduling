import { z } from "zod";

export const roomSchema = z.object({
  buildingName: z.string().min(1, "Select a building."),
  name: z.string().min(1, "Enter a room name."),
  floor: z.number().int().min(1, "Enter a valid floor number."),
  capacity: z.number().int().min(1, "Enter a valid capacity."),
  type: z.string().min(1, "Select a room type."),
});
