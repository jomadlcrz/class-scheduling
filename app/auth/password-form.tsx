import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { PasswordInput } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { MIN_PASSWORD_LENGTH } from "~/lib/validators";
import { makeChangePasswordSchema } from "~/schemas/auth.schema";

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

    const schema = makeChangePasswordSchema(requireCurrentPassword);
    const result = schema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({
        ...(requireCurrentPassword ? { currentPassword: result.data.currentPassword } : {}),
        newPassword: result.data.newPassword,
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

      <button
        type="submit"
        disabled={isLoading}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-navy-800/20 transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100 dark:focus-visible:ring-offset-surface"
      >
        {isLoading ? (
          <>
            <Spinner />
            {loadingLabel}
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
