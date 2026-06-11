import { useState } from "react";
import { FormError } from "../components/forms/form-error";
import { Button } from "../components/ui/button";
import { PasswordInput } from "../components/ui/input";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "../lib/validators";

export type PasswordFormValues = {
  currentPassword?: string;
  newPassword: string;
};

type PasswordFormProps = {
  /** Require the user's current password (authenticated change flow). */
  requireCurrentPassword?: boolean;
  submitLabel: string;
  loadingLabel: string;
  onSubmit: (values: PasswordFormValues) => Promise<void>;
};

/**
 * Shared password form used by both /reset-password (token flow) and
 * /change-password (authenticated flow). Validation, visibility toggles,
 * and loading/error states live here; the routes own page chrome and
 * success states.
 */
export function PasswordForm({
  requireCurrentPassword = false,
  submitLabel,
  loadingLabel,
  onSubmit,
}: PasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const currentPassword = String(data.get("current-password") ?? "");
    const newPassword = String(data.get("new-password") ?? "");
    const confirmPassword = String(data.get("confirm-password") ?? "");

    const validationError = validateNewPassword({
      newPassword,
      confirmPassword,
      currentPassword,
      requireCurrentPassword,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({
        ...(requireCurrentPassword ? { currentPassword } : {}),
        newPassword,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
      <FormError message={error} />

      {requireCurrentPassword && (
        <PasswordInput
          id="current-password"
          label="Current Password"
          autoComplete="current-password"
        />
      )}

      <PasswordInput
        id="new-password"
        label="New Password"
        autoComplete="new-password"
        hint={`Must be at least ${MIN_PASSWORD_LENGTH} characters.`}
      />

      <PasswordInput
        id="confirm-password"
        label="Confirm New Password"
        autoComplete="new-password"
      />

      <Button isLoading={isLoading} loadingLabel={loadingLabel}>
        {submitLabel}
      </Button>
    </form>
  );
}
