import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "Enter the user's full name."),
  email: z.email("Enter a valid email address."),
  role: z.enum(["admin", "registrar", "dean", "faculty", "student"]),
});
