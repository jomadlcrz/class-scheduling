import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input, inputClassName, PasswordInput } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { SettingsRow } from "~/components/ui/settings-row";
import { SettingsPageHeader } from "~/features/settings/settings-page-header";
import { useAuth } from "~/hooks/use-auth";
import { Breadcrumb } from "~/layouts/breadcrumb";

export function ProfileSettings() {
  const { user } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  if (!user) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div>
      <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Profile" }]} />
      <SettingsPageHeader title="Profile" />

      <div className="mt-6 flex flex-col divide-y divide-slate-200 dark:divide-white/10">
        <SettingsRow label="Profile Picture" hint="Click the image to change your profile picture.">
          <button
            type="button"
            aria-label="Edit profile picture"
            className="group relative inline-flex cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface"
          >
            <span
              aria-hidden="true"
              className="grid size-20 place-items-center rounded-full bg-navy-800 font-body text-2xl font-medium text-white transition-opacity duration-150 group-hover:opacity-90 dark:bg-white dark:text-navy-900"
            >
              {initials}
            </span>
          </button>
        </SettingsRow>

        <SettingsRow label="First Name" htmlFor="profile-first-name">
          <input
            id="profile-first-name"
            name="profile-first-name"
            type="text"
            defaultValue={user.firstName}
            className={inputClassName}
          />
        </SettingsRow>

        <SettingsRow label="Last Name" htmlFor="profile-last-name">
          <input
            id="profile-last-name"
            name="profile-last-name"
            type="text"
            defaultValue={user.lastName}
            className={inputClassName}
          />
        </SettingsRow>

        <SettingsRow label="Email Address">
          <div className="flex items-center gap-3">
            <p className="min-w-0 truncate font-body text-sm text-navy-700 dark:text-mist-100">
              {user.email}
            </p>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => setEmailModalOpen(true)}
            >
              Change
            </Button>
          </div>
        </SettingsRow>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="button" block={false}>
          Update Profile
        </Button>
      </div>

      <Modal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="Change Email">
        <div className="flex flex-col gap-4">
          <Input
            id="change-email-address"
            label="New Email Address"
            type="email"
            autoComplete="email"
            placeholder={user.email}
            hint="If you change your email, you may need to reconfirm your account."
          />
          <PasswordInput
            id="change-email-password"
            label="Current Password"
            autoComplete="current-password"
          />
          <Button type="button">Change Email</Button>
        </div>
      </Modal>
    </div>
  );
}
