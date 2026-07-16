import type { ComponentType } from "react";
import { Link } from "react-router";
import { BellIcon, ChevronRightIcon, KeyIcon, PaletteIcon, TrashIcon, UserIcon } from "~/components/ui/icons";
import { useAuth } from "~/hooks/use-auth";
import { PageHeader } from "~/layouts/page-header";
import type { Role } from "~/types/user";

type SettingsSection = {
  label: string;
  description: string;
  href: string;
  icon: ComponentType;
  roles?: Role[];
};

const SECTIONS: SettingsSection[] = [
  {
    label: "Profile",
    description: "Your account details and profile picture.",
    href: "/settings/profile",
    icon: UserIcon,
  },
  {
    label: "Appearance",
    description: "Choose how the interface looks on this device.",
    href: "/settings/appearance",
    icon: PaletteIcon,
  },
  {
    label: "Notifications",
    description: "Choose which in-app notifications you receive.",
    href: "/settings/notifications",
    icon: BellIcon,
  },
  {
    label: "Account & Security",
    description: "Change the password you use to sign in.",
    href: "/settings/security",
    icon: KeyIcon,
  },
  {
    label: "Recently Deleted",
    description: "Restore items deleted within the last 30 days.",
    href: "/settings/recently-deleted",
    icon: TrashIcon,
    roles: ["admin", "registrar"],
  },
];

export function SettingsHome() {
  const { user } = useAuth();
  const role = user?.role;

  const visibleSections = SECTIONS.filter((s) => !s.roles || (role && s.roles.includes(role)));

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account, preferences, and system options." />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {visibleSections.map((section) => (
          <Link
            key={section.href}
            to={section.href}
            className="group flex items-center gap-4 rounded-xl border border-slate-300 bg-white p-4 transition-colors duration-150 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-700 dark:bg-white/10 dark:text-white">
              <section.icon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-body text-sm font-semibold text-navy-700 dark:text-white">
                {section.label}
              </span>
              <span className="mt-0.5 block truncate font-body text-xs text-slate-500 dark:text-slate-400">
                {section.description}
              </span>
            </span>
            <span className="shrink-0 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-slate-600">
              <ChevronRightIcon />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
