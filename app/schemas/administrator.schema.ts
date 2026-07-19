import { z } from "zod";
import { ADMINISTRATOR_ROLES } from "~/types/administrator";

export { ADMINISTRATOR_ROLES };

export const administratorSchema = z.object({
  firstName: z.string().min(1, "Enter the first name."),
  midName: z.string(),
  lastName: z.string().min(1, "Enter the last name."),
  email: z.email("Enter a valid email address."),
  roleName: z.enum(ADMINISTRATOR_ROLES, { message: "Select a role." }),
  departmentId: z.coerce.number().int().positive("Select a department for Registrar Admin.").optional(),
});
