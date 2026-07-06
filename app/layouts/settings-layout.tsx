import type { ComponentType } from "react";
import { NavLink, Outlet } from "react-router";
import { KeyIcon, PaletteIcon, TrashIcon, UserIcon } from "../components/ui/icons";
import { useAuth } from "../hooks/use-auth";
import type { Role } from "../types/user";
import { PageHeader } from "./page-header";

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

export default function SettingsLayout() {
  const { user } = useAuth();
  const role = user?.role;

  const visibleNav = SETTINGS_NAV.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and preferences." />

      <div className="mt-6 flex flex-col gap-6">
        <nav
          aria-label="Settings navigation"
          className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/8"
        >
          {visibleNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                  isActive
                    ? "border-navy-700 text-navy-700 dark:border-gold-400 dark:text-gold-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`
              }
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div>
          <Outlet />
        </div>
      </div>
    </>
  );
}
