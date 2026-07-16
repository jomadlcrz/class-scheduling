import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { SettingsCard } from "~/components/ui/settings-card";
import { useAuth } from "~/hooks/use-auth";
import { Breadcrumb } from "~/layouts/breadcrumb";
import { PageHeader } from "~/layouts/page-header";
import type { Role } from "~/types/user";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  registrar: "Registrar",
  dean: "Dean",
  faculty: "Faculty",
  student: "Student",
};

export function ProfileSettings() {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Profile" }]} />
      <PageHeader title="Profile" description="Your account details as recorded in the system." />

      <div className="mt-6 flex flex-col gap-6">
        <SettingsCard title="Profile Picture">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="grid size-14 shrink-0 place-items-center rounded-full bg-navy-800 font-body text-xl font-medium text-white dark:bg-white dark:text-navy-900"
            >
              {initials}
            </span>
            <Button type="button" variant="outline" block={false} disabled>
              Change Photo
            </Button>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Personal Information"
          footer={
            <Button type="button" block={false} disabled>
              Update Profile
            </Button>
          }
        >
          <div className="flex flex-col gap-4">
            <Input id="profile-name" label="Full Name" type="text" defaultValue={user.name} disabled />
            <div>
              <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Email
              </p>
              <p className="mt-1 font-body text-sm text-navy-700 dark:text-white">{user.email}</p>
            </div>
            <div>
              <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Role
              </p>
              <span className="mt-1 inline-block rounded-full bg-navy-100 px-2.5 py-0.5 font-body text-xs font-medium text-navy-700 dark:bg-white/10 dark:text-slate-300">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
