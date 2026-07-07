import { z } from "zod";

export const facultySchema = z.object({
  firstName: z.string().min(1, "Enter the first name."),
  lastName: z.string().min(1, "Enter the last name."),
  email: z.email("Enter a valid email address."),
  departmentId: z.string().min(1, "Select a department."),
  specialization: z.string(),
  status: z.enum(["active", "inactive"]),
  maxWeeklyHours: z.coerce.number().min(1, "Enter max weekly hours."),
});
