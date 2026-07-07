import { z } from "zod";

export const deanSchema = z.object({
  name: z.string().min(1, "Enter the name."),
  email: z.email("Enter a valid email address."),
  departmentId: z.string().min(1, "Select a department."),
  status: z.enum(["active", "inactive"]),
});
