import { useState, type ReactNode } from "react";
import { PasswordForm, type PasswordFormValues } from "~/auth/password-form";
import { Badge } from "~/components/ui/badge";
import { CheckIcon, ChevronRightIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { SettingsCard } from "~/components/ui/settings-card";
import { Breadcrumb } from "~/layouts/breadcrumb";
import { PageHeader } from "~/layouts/page-header";
import { authService } from "~/services/auth.service";

type SecurityRowProps = {
  label: string;
  description?: string;
  trailing: ReactNode;
  onClick?: () => void;
};

/** One clickable (or inert, when onClick is omitted) row in the security list. */
function SecurityRow({ label, description, trailing, onClick }: SecurityRowProps) {
  const content = (
    <>
      <div>
        <p className="font-body text-sm font-medium text-navy-700 dark:text-white">{label}</p>
        {description && (
          <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailing}
        <span className="text-slate-300 dark:text-slate-600">
          <ChevronRightIcon />
        </span>
      </div>
    </>
  );

  if (!onClick) {
    return (
      <div className="flex w-full items-center justify-between gap-4 py-4 opacity-60">{content}</div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/5"
    >
      {content}
    </button>
  );
}

export function SecuritySettings() {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit({ currentPassword, newPassword }: PasswordFormValues) {
    await authService.changePassword(newPassword, currentPassword);
    setDone(true);
  }

  function closePasswordModal() {
    setPasswordModalOpen(false);
    setDone(false);
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Account & Security" }]} />
      <PageHeader
        title="Account & Security"
        description="Manage how you sign in and keep your account secure."
      />

      <div className="mt-6">
        <SettingsCard title="Password & Security">
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/8">
            <SecurityRow
              label="Password"
              description="Change the password you use to sign in."
              trailing={
                <span className="font-body text-sm font-medium text-blue-700 dark:text-blue-400">
                  Change Password
                </span>
              }
              onClick={() => setPasswordModalOpen(true)}
            />
            <SecurityRow
              label="Two-Factor Authentication"
              description="Add an extra layer of security when you sign in."
              trailing={<Badge tone="slate">Not available</Badge>}
            />
            <SecurityRow
              label="Active Sessions"
              description="See where you're signed in and sign out remotely."
              trailing={<Badge tone="slate">Not available</Badge>}
            />
          </div>
        </SettingsCard>
      </div>

      <Modal open={passwordModalOpen} onClose={closePasswordModal} title="Change Password">
        {done ? (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/10">
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
                onClick={closePasswordModal}
                className="mt-2 font-body text-sm font-medium text-green-700 underline underline-offset-2 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-green-400 dark:hover:text-green-300"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // PasswordForm's own mt-8 is meant to clear an AuthHeading on the public
          // auth pages — zero it out here since it's the modal's first element.
          <div className="[&>form]:mt-0">
            <PasswordForm
              requireCurrentPassword
              submitLabel="Update Password"
              loadingLabel="Updating…"
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
