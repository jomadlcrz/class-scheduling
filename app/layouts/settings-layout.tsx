import type { ComponentType } from "react";
import { NavLink, Outlet } from "react-router";
import { BellIcon, KeyIcon, PaletteIcon, TrashIcon, UserIcon } from "~/components/ui/icons";
import { useAuth } from "~/hooks/use-auth";
import type { Role } from "~/types/user";

type SettingsNavItem = {
  label: string;
  href: string;
  icon: ComponentType;
  roles?: Role[];
};

type SettingsNavGroup = {
  label: string;
  items: SettingsNavItem[];
};

const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/settings/profile", icon: UserIcon },
      { label: "Appearance", href: "/settings/appearance", icon: PaletteIcon },
      { label: "Security", href: "/settings/security", icon: KeyIcon },
      { label: "Notifications", href: "/settings/notifications", icon: BellIcon },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Recently Deleted",
        href: "/settings/recently-deleted",
        icon: TrashIcon,
        roles: ["admin", "registrar"],
      },
    ],
  },
];

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 font-body text-sm whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
    isActive
      ? "bg-navy-50 font-semibold text-navy-700 dark:bg-white/10 dark:text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-navy-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
  }`;

export default function SettingsLayout() {
  const { user } = useAuth();
  const role = user?.role;

  const visibleGroups = SETTINGS_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Mobile: horizontal scrollable tabs — a fixed sidebar doesn't fit small screens. */}
      <nav
        aria-label="Settings"
        className="mb-6 flex flex-row gap-1 overflow-x-auto scrollbar-none sm:hidden"
      >
        {visibleGroups
          .flatMap((group) => group.items)
          .map((item) => (
            <NavLink key={item.href} to={item.href} className={linkClassName} end>
              <item.icon />
              {item.label}
            </NavLink>
          ))}
      </nav>

      <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
        {/* Desktop: sticky left sidebar, grouped into Account / Administration. */}
        <nav aria-label="Settings" className="hidden w-52 shrink-0 sm:block">
          <div className="sticky top-6 flex flex-col gap-6">
            {visibleGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.label}
                </p>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <NavLink key={item.href} to={item.href} className={linkClassName} end>
                      <item.icon />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
