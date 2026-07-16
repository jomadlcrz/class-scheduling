import { useState } from "react";
import { PasswordForm, type PasswordFormValues } from "~/auth/password-form";
import { CheckIcon } from "~/components/ui/icons";
import { SettingsCard } from "~/components/ui/settings-card";
import { PageHeader } from "~/layouts/page-header";
import { authService } from "~/services/auth.service";

export function SecuritySettings() {
  const [done, setDone] = useState(false);

  async function handleSubmit({ currentPassword, newPassword }: PasswordFormValues) {
    await authService.changePassword(newPassword, currentPassword);
    setDone(true);
  }

  return (
    <div>
      <PageHeader title="Security" description="Change the password you use to sign in." />

      <div className="mt-6">
        <SettingsCard title="Change Password">
          {done ? (
            <div className="flex max-w-sm items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/10">
              <span className="mt-0.5 shrink-0 text-green-600 dark:text-green-400">
                <CheckIcon />
              </span>
              <div>
                <p className="font-body text-sm font-semibold text-green-800 dark:text-green-300">
                  Password updated
                </p>
                <p className="mt-0.5 font-body text-sm text-green-700 dark:text-green-400">
                  Your new password is active. Use it the next time you log in.
                </p>
                <button
                  type="button"
                  onClick={() => setDone(false)}
                  className="mt-2 font-body text-sm font-medium text-green-700 underline underline-offset-2 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-green-400 dark:hover:text-green-300"
                >
                  Change again
                </button>
              </div>
            </div>
          ) : (
            // PasswordForm's own mt-8 is meant to clear an AuthHeading on the public
            // auth pages — zero it out here instead of stacking margins, and cap the
            // fields at a readable width without shrinking the card itself.
            <div className="max-w-sm [&>form]:mt-0">
              <PasswordForm
                requireCurrentPassword
                submitLabel="Update Password"
                loadingLabel="Updating…"
                onSubmit={handleSubmit}
              />
            </div>
          )}
        </SettingsCard>
      </div>
    </div>
  );
}
