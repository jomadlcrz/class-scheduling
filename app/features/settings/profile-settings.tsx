import { BellIcon } from "~/components/ui/icons";
import { useAuth } from "~/hooks/use-auth";
import { PageHeader } from "~/layouts/page-header";
import type { Role } from "~/types/user";
import { NotificationSettings } from "~/features/settings/notification-settings";

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
      <PageHeader title="Profile" description="Your account details as recorded in the system." />

      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4 rounded-xl border border-slate-300 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-navy-800 font-body text-xl font-medium text-white dark:bg-white dark:text-navy-900"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-base font-semibold text-navy-700 dark:text-white">
              {user.name}
            </p>
            <p className="truncate font-body text-sm text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
            <span className="mt-1.5 inline-block rounded-full bg-navy-100 px-2.5 py-0.5 font-body text-xs font-medium text-navy-700 dark:bg-white/10 dark:text-slate-300">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>

        <p className="-mt-4 font-body text-xs text-slate-400 dark:text-slate-500">
          To update your name or email, contact your system administrator.
        </p>

        <div className="border-t border-slate-100 dark:border-white/8" />

        <section aria-labelledby="profile-notif-heading">
          <div className="mb-4 flex items-center gap-2">
            <BellIcon />
            <h2
              id="profile-notif-heading"
              className="font-body text-base font-semibold text-navy-700 dark:text-white"
            >
              Notifications
            </h2>
          </div>
          <p className="mb-4 font-body text-sm text-slate-500 dark:text-slate-400">
            Choose which in-app notifications you receive.
          </p>
          <NotificationSettings />
        </section>
      </div>
    </div>
  );
}
