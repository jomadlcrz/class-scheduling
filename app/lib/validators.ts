export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

type NewPasswordFields = {
  newPassword: string;
  confirmPassword: string;
  currentPassword?: string;
  /** Authenticated change flow: current password is required and must differ. */
  requireCurrentPassword?: boolean;
};

/** Returns an error message for the first failing rule, or null when valid. */
export function validateNewPassword({
  newPassword,
  confirmPassword,
  currentPassword = "",
  requireCurrentPassword = false,
}: NewPasswordFields): string | null {
  if (requireCurrentPassword && !currentPassword) {
    return "Enter your current password.";
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (newPassword !== confirmPassword) {
    return "Passwords don't match.";
  }
  if (requireCurrentPassword && newPassword === currentPassword) {
    return "New password must be different from your current password.";
  }
  return null;
}
