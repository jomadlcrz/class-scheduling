import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "../lib/validators";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your email and password."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export function makeChangePasswordSchema(requireCurrentPassword: boolean) {
  return z
    .object({
      currentPassword: requireCurrentPassword
        ? z.string().min(1, "Enter your current password.")
        : z.string().optional(),
      newPassword: z
        .string()
        .min(
          MIN_PASSWORD_LENGTH,
          `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        ),
      confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords don't match.",
          path: ["confirmPassword"],
        });
      }
      if (requireCurrentPassword && data.newPassword === data.currentPassword) {
        ctx.addIssue({
          code: "custom",
          message: "New password must be different from your current password.",
          path: ["newPassword"],
        });
      }
    });
}
