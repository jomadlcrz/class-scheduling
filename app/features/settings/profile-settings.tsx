import { useState } from "react";
import { Button } from "~/components/ui/button";
import { EditIcon } from "~/components/ui/icons";
import { Input, PasswordInput } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { SettingsCard } from "~/components/ui/settings-card";
import { useAuth } from "~/hooks/use-auth";
import { Breadcrumb } from "~/layouts/breadcrumb";
import { PageHeader } from "~/layouts/page-header";

export function ProfileSettings() {
  const { user } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  if (!user) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div>
      <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Profile" }]} />
      <PageHeader title="Profile" description="Your account details as recorded in the system." />

      <div className="mt-6 flex flex-col gap-6">
        <SettingsCard
          title="Personal Information"
          footer={
            <Button type="button" block={false}>
              Update Profile
            </Button>
          }
        >
          <div className="flex flex-col items-center gap-6 md:flex-row-reverse md:items-start">
            <button
              type="button"
              aria-label="Edit profile picture"
              className="group relative shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-navy-950"
            >
              <span
                aria-hidden="true"
                className="grid size-40 place-items-center rounded-full bg-navy-800 font-body text-5xl font-medium text-white transition-opacity duration-150 group-hover:opacity-90 sm:size-48 dark:bg-white dark:text-navy-900"
              >
                {initials}
              </span>
              <span className="absolute bottom-3 -left-1 inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 font-body text-xs font-medium text-navy-700 transition-colors duration-150 group-hover:bg-slate-50 dark:border-white/15 dark:bg-navy-800 dark:text-white dark:group-hover:bg-navy-700 [&_svg]:size-3.5">
                <EditIcon />
                Edit
              </span>
            </button>

            <div className="flex w-full flex-1 flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <Input
                    id="profile-first-name"
                    label="First Name"
                    type="text"
                    defaultValue={user.firstName}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    id="profile-last-name"
                    label="Last Name"
                    type="text"
                    defaultValue={user.lastName}
                  />
                </div>
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-gray-600 dark:text-slate-400">
                  Email Address
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <p className="min-w-0 truncate font-body text-sm text-navy-700 dark:text-white">
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
              </div>
            </div>
          </div>
        </SettingsCard>
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
