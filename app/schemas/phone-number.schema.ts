import { z } from "zod";
import { normalizePhoneNumber } from "~/lib/phone-number";

export const phoneNumberSchema = z
  .string()
  .trim()
  .transform((value, context) => {
    const normalized = normalizePhoneNumber(value);
    if (!normalized) {
      context.addIssue({
        code: "custom",
        message: "Enter a valid mobile number.",
      });
      return z.NEVER;
    }
    return normalized;
  });

