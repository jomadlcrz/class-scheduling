import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { CheckIcon } from "~/components/ui/icons";
import { PasswordInput } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { ApiError } from "~/lib/api";
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

function RequirementItem({ satisfied, label }: { satisfied: boolean; label: string }) {
  return (
    <li
      className={`flex items-center gap-2 transition-colors duration-150 ${satisfied
          ? "font-medium text-emerald-700 dark:text-emerald-400"
          : "text-slate-500 dark:text-slate-400"
        }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${satisfied
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
            : "bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-500"
          }`}
      >
        {satisfied ? (
          <CheckIcon size={10} strokeWidth={3} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </span>
      <span>{label}</span>
    </li>
  );
}

/**
 * Shared password form used by both /reset-password (token flow) and
 * /change-password (authenticated flow). Validation, visibility toggles,
 * requirements indicators, and loading/error states live here.
 */
export function PasswordForm({
  requireCurrentPassword = false,
  submitLabel,
  loadingLabel,
  onSubmit,
}: PasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const currentPassword = String(data.get("current-password") ?? "");
    const pwd = String(data.get("new-password") ?? "");
    const confirmPassword = String(data.get("confirm-password") ?? "");

    const schema = makeChangePasswordSchema(requireCurrentPassword);
    const result = schema.safeParse({ currentPassword, newPassword: pwd, confirmPassword });
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
      if (err instanceof ApiError && typeof err.details?.requirements === "string") {
        setError(`${err.message}\n\n${err.details.requirements.trim()}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
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
        value={newPassword}
        onChange={(e) => setNewPassword(e.currentTarget.value)}
      />

      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/5">
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Password Requirements
        </p>
        <ul className="mt-2.5 flex flex-col gap-2 font-body text-xs">
          <RequirementItem
            satisfied={newPassword.length >= 8}
            label="Minimum 8 characters long"
          />
          <RequirementItem
            satisfied={/[a-z]/.test(newPassword)}
            label="At least one lowercase letter (a-z)"
          />
          <RequirementItem
            satisfied={/[A-Z]/.test(newPassword)}
            label="At least one uppercase letter (A-Z)"
          />
          <RequirementItem
            satisfied={/\d/.test(newPassword)}
            label="At least one number (0-9)"
          />
          <RequirementItem
            satisfied={/[@$!%*?&\.]/.test(newPassword)}
            label="At least one special character (@ $ ! % * ? & .)"
          />
        </ul>
      </div>

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
