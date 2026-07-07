import type { ComponentType } from "react";
import { NavLink, Outlet } from "react-router";
import { KeyIcon, PaletteIcon, TrashIcon, UserIcon } from "~/components/ui/icons";
import { useAuth } from "~/hooks/use-auth";
import type { Role } from "~/types/user";

type SettingsNavItem = {
  label: string;
  href: string;
  icon: ComponentType;
  roles?: Role[];
};

const SETTINGS_NAV: SettingsNavItem[] = [
  { label: "Profile", href: "/settings/profile", icon: UserIcon },
  { label: "Appearance", href: "/settings/appearance", icon: PaletteIcon },
  { label: "Security", href: "/settings/security", icon: KeyIcon },
  { label: "Recently Deleted", href: "/settings/recently-deleted", icon: TrashIcon, roles: ["admin"] },
];

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
    isActive
      ? "bg-navy-50 font-semibold text-navy-700 dark:bg-white/10 dark:text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-navy-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
  }`;

export default function SettingsLayout() {
  const { user } = useAuth();
  const role = user?.role;

  const visibleNav = SETTINGS_NAV.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:flex-row">
      <nav aria-label="Settings" className="flex shrink-0 flex-row flex-wrap gap-1 sm:w-48 sm:flex-col">
        {visibleNav.map((item) => (
          <NavLink key={item.href} to={item.href} className={linkClassName} end>
            <item.icon />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
