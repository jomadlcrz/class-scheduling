import { useState } from "react";

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

const MIN_PASSWORD_LENGTH = 8;

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

    if (requireCurrentPassword && !currentPassword) {
      setError("Enter your current password.");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (requireCurrentPassword && newPassword === currentPassword) {
      setError("New password must be different from your current password.");
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
      {/* Error feedback */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 font-sans text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
        >
          {error}
        </div>
      )}

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
        className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-navy-800 py-3 font-sans text-base font-medium text-white transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
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

type PasswordInputProps = {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  hint?: string;
};

function PasswordInput({ id, label, autoComplete, hint }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-sans text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          placeholder="••••••••"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-4 pr-11 font-sans text-base text-slate-900 placeholder-slate-400 outline-none transition-colors duration-150 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500 dark:focus:border-gold-400 dark:focus:ring-gold-400/25"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors duration-150 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:text-slate-300"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="font-sans text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
