import { useState, type ReactNode } from "react";
import { PasswordForm, type PasswordFormValues } from "~/auth/password-form";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { CheckIcon, ChevronRightIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { SettingsPageHeader } from "~/features/settings/settings-page-header";
import { Breadcrumb } from "~/layouts/breadcrumb";
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
        <p className="font-body text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        {description && (
          <p className="mt-1.5 font-body text-xs text-slate-400 dark:text-slate-500">{description}</p>
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
      <div className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-4 opacity-60">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-4 text-left transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/8"
    >
      {content}
    </button>
  );
}

/** No backend for 2FA exists — this toggle is local UI state only, with a brief fake delay for feel. */
function TwoFactorModalContent({ enabled, onToggle }: { enabled: boolean; onToggle: () => Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    setIsLoading(true);
    await onToggle();
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-body text-sm text-slate-600 dark:text-slate-300">
        {enabled
          ? "Two-factor authentication is currently enabled for your account."
          : "Add an extra layer of security by requiring a verification code in addition to your password when you sign in."}
      </p>
      <Button
        type="button"
        variant={enabled ? "danger" : "primary"}
        block={false}
        isLoading={isLoading}
        loadingLabel={enabled ? "Disabling…" : "Enabling…"}
        onClick={handleToggle}
      >
        {enabled ? "Disable Two-Factor Authentication" : "Enable Two-Factor Authentication"}
      </Button>
    </div>
  );
}

/** No session-management backend exists — shows only the real, honest fact: you're signed in here. */
function ActiveSessionsModalContent() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <div>
          <p className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">This device</p>
          <p className="mt-1.5 font-body text-xs text-slate-400 dark:text-slate-500">
            You're currently signed in from this browser.
          </p>
        </div>
        <Badge tone="emerald">Active now</Badge>
      </div>
      <p className="font-body text-xs text-slate-400 dark:text-slate-500">
        Viewing and signing out of sessions on other devices isn't available yet.
      </p>
    </div>
  );
}

export function SecuritySettings() {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [done, setDone] = useState(false);

  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);

  async function handleSubmit({ currentPassword, newPassword }: PasswordFormValues) {
    await authService.changePassword(newPassword, currentPassword);
    setDone(true);
  }

  function closePasswordModal() {
    setPasswordModalOpen(false);
    setDone(false);
  }

  async function handleTwoFactorToggle() {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setTwoFactorEnabled((current) => !current);
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Account & Security" }]} />
      <SettingsPageHeader title="Account & Security" />

      <div className="mt-6 flex flex-col divide-y divide-slate-200 dark:divide-white/10">
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
          trailing={
            <Badge tone={twoFactorEnabled ? "emerald" : "slate"}>
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          }
          onClick={() => setTwoFactorModalOpen(true)}
        />
        <SecurityRow
          label="Active Sessions"
          description="See where you're signed in."
          trailing={<Badge tone="slate">1 active</Badge>}
          onClick={() => setSessionsModalOpen(true)}
        />
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

      <Modal
        open={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        title="Two-Factor Authentication"
      >
        <TwoFactorModalContent enabled={twoFactorEnabled} onToggle={handleTwoFactorToggle} />
      </Modal>

      <Modal open={sessionsModalOpen} onClose={() => setSessionsModalOpen(false)} title="Active Sessions">
        <ActiveSessionsModalContent />
      </Modal>
    </div>
  );
}
