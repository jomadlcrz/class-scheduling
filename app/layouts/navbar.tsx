import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  BellIcon,
  ChevronDownIcon,
  LogoutIcon,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
} from "~/components/ui/icons";
import { Popover } from "~/components/ui/popover";
import { useAuth } from "~/hooks/use-auth";
import { useTheme, type ThemePreference } from "~/hooks/use-theme";

/** Static placeholders until a notifications backend exists. */
const NOTIFICATIONS = [
  { title: "New schedule published", time: "5 minutes ago", date: "13 JUL" },
  { title: "Room conflict detected", time: "18 minutes ago", date: "13 JUL" },
  { title: "Faculty load report ready", time: "1 hour ago", date: "12 JUL" },
];

const iconButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-full text-navy-700 transition-colors duration-150 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-200 dark:hover:bg-white/10";

const menuItemClassName =
  "flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-md p-2.5 text-left font-body text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white [&>svg]:size-3.5";

export function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-slate-300 bg-white/95 px-4 backdrop-blur-md sm:px-6 dark:border-white/8 dark:bg-navy-950/90">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle navigation menu"
        className={iconButtonClassName}
      >
        <MenuIcon />
      </button>

      <div className="flex-1" />

      {user && (
        <Popover
          label="Open notifications"
          trigger={
            <span className="relative grid place-items-center">
              <BellIcon />
              <span
                aria-hidden="true"
                className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-red-600 font-body text-[0.6rem] font-bold text-white"
              >
                {NOTIFICATIONS.length}
              </span>
            </span>
          }
          triggerClassName={iconButtonClassName}
          className="w-80 px-1.5"
        >
          {(close) => (
            <>
              <div className="mb-1 border-b border-slate-100 px-2.5 py-2.5 font-body text-sm font-semibold text-slate-800 dark:border-white/10 dark:text-white">
                Notifications
              </div>
              {NOTIFICATIONS.map((notification) => (
                <button
                  key={notification.title}
                  type="button"
                  role="menuitem"
                  onClick={close}
                  className={`${menuItemClassName} justify-between gap-3`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
                      {notification.title}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {notification.time}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.65rem] font-semibold text-slate-400 dark:text-slate-500">
                    {notification.date}
                  </span>
                </button>
              ))}
            </>
          )}
        </Popover>
      )}

      {user && (
        <Popover
          label="Open user menu"
          trigger={
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-800 font-body text-xs font-medium text-white dark:bg-white dark:text-navy-900"
              >
                {initials(user.name)}
              </span>
              <span className="hidden flex-col items-start leading-tight sm:flex">
                <span className="font-body text-sm font-medium text-navy-700 dark:text-white">
                  {firstName(user.name)}
                </span>
                <span className="font-body text-xs capitalize text-slate-500 dark:text-slate-400">
                  {user.role}
                </span>
              </span>
              <span className="hidden text-slate-400 sm:block">
                <ChevronDownIcon />
              </span>
            </span>
          }
          triggerClassName="ml-1 flex cursor-pointer items-center rounded-lg px-1 py-1 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/8"
          className="w-72 px-1.5"
        >
          {(close) => (
            <>
              <div className="mb-1 flex items-center gap-3 border-b border-slate-100 px-2.5 pb-3 pt-2 dark:border-white/10">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-800 font-body text-base font-medium text-white dark:bg-white dark:text-navy-900"
                >
                  {initials(user.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-semibold text-slate-800 dark:text-white">
                    {user.name}
                  </p>
                  <p className="truncate font-body text-xs text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="menuitem"
                className={menuItemClassName}
                onClick={() => {
                  close();
                  navigate("/settings/profile");
                }}
              >
                Profile <UserIcon />
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClassName}
                onClick={() => {
                  close();
                  navigate("/settings");
                }}
              >
                Settings <SettingsIcon />
              </button>
              <ThemeRow />
              <button
                type="button"
                role="menuitem"
                className={`${menuItemClassName} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10`}
                onClick={() => {
                  close();
                  handleLogout();
                }}
              >
                Log out <LogoutIcon />
              </button>
            </>
          )}
        </Popover>
      )}
    </header>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof MonitorIcon }[] = [
  { value: "system", label: "System theme", icon: MonitorIcon },
  { value: "light", label: "Light theme", icon: SunIcon },
  { value: "dark", label: "Dark theme", icon: MoonIcon },
];

/** "Theme" menu row with a system/light/dark segmented control; stays open on change. */
function ThemeRow() {
  const { preference, setPreference } = useTheme();

  // The stored preference is only known on the client, so defer the active state
  // until after mount to keep the first paint matching the server-rendered markup.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex w-full items-center justify-between gap-2.5 p-2.5">
      <span className="font-body text-sm text-slate-600 dark:text-slate-300">Theme</span>
      <div
        role="radiogroup"
        aria-label="Theme"
        className="-mr-1.5 flex items-center gap-0.5 rounded-full border border-slate-200 p-0.5 dark:border-white/10"
      >
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isActive = mounted && preference === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={label}
              title={label}
              onClick={() => setPreference(value)}
              className={`grid size-5 cursor-pointer place-items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                isActive
                  ? "bg-navy-800 text-white dark:bg-white dark:text-navy-900"
                  : "text-slate-400 hover:text-navy-700 dark:text-slate-500 dark:hover:text-white"
              }`}
            >
              <Icon size={12} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
