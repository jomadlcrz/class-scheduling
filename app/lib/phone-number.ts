import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js/min";

const DEFAULT_COUNTRY = "PH" as const;
export const MAX_PHONE_DIGITS = 10;
export const MAX_FORMATTED_PHONE_LENGTH = 12;

function nationalDigits(value: string): string | null {
  const trimmed = value.trim();
  let digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+")) {
    if (!digits.startsWith("63")) return null;
    digits = digits.slice(2);
  } else if (digits.startsWith("63") && digits.length > MAX_PHONE_DIGITS) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
}

/** Formats only the national portion; PhoneInput renders the fixed +63 prefix. */
export function formatPhoneNumberInput(value: string): string {
  const digits = nationalDigits(value);
  if (digits === null) return "";
  const bounded = digits.slice(0, MAX_PHONE_DIGITS);
  const formatted = new AsYouType(DEFAULT_COUNTRY).input(`0${bounded}`);
  return formatted.startsWith("0") ? formatted.slice(1) : formatted;
}

/** Returns a canonical E.164 number, or null when the value is not a valid phone number. */
export function normalizePhoneNumber(value: string): string | null {
  const digits = nationalDigits(value);
  if (!digits || digits.length > MAX_PHONE_DIGITS) return null;
  const phoneNumber = parsePhoneNumberFromString(`+63${digits}`);
  return phoneNumber?.country === DEFAULT_COUNTRY && phoneNumber.isValid() ? phoneNumber.number : null;
}

export function isValidPhoneNumber(value: string): boolean {
  return normalizePhoneNumber(value) !== null;
}
