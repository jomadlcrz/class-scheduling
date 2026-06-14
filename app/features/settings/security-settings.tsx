import { useState } from "react";
import { PasswordForm, type PasswordFormValues } from "../../auth/password-form";
import { CheckIcon } from "../../components/ui/icons";
import { authService } from "../../services/auth.service";

export function SecuritySettings() {
  const [done, setDone] = useState(false);

  async function handleSubmit({ currentPassword, newPassword }: PasswordFormValues) {
    await authService.changePassword(newPassword, currentPassword);
    setDone(true);
  }

  return (
    <div className="max-w-sm">
      <div className="flex flex-col gap-1">
        <h2 className="font-sans text-base font-semibold text-navy-700 dark:text-white">
          Change Password
        </h2>
        <p className="font-sans text-sm text-slate-500 dark:text-slate-400">
          Keep your account secure by using a strong, unique password.
        </p>
      </div>

      {done ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/10">
          <span className="mt-0.5 shrink-0 text-green-600 dark:text-green-400">
            <CheckIcon />
          </span>
          <div>
            <p className="font-sans text-sm font-semibold text-green-800 dark:text-green-300">
              Password updated
            </p>
            <p className="mt-0.5 font-sans text-sm text-green-700 dark:text-green-400">
              Your new password is active. Use it the next time you log in.
            </p>
            <button
              type="button"
              onClick={() => setDone(false)}
              className="mt-2 font-sans text-sm font-medium text-green-700 underline underline-offset-2 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-green-400 dark:hover:text-green-300"
            >
              Change again
            </button>
          </div>
        </div>
      ) : (
        <PasswordForm
          requireCurrentPassword
          submitLabel="Update Password"
          loadingLabel="Updating…"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
