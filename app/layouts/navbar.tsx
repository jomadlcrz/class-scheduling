import { useNavigate } from "react-router";
import { ThemeToggle } from "~/components/theme/theme-toggle";
import { Popover } from "~/components/ui/popover";
import {
  BellIcon,
  ChevronDownIcon,
  KeyIcon,
  LogoutIcon,
  MenuIcon,
  PaletteIcon,
  UserIcon,
} from "~/components/ui/icons";
import { useAuth } from "~/hooks/use-auth";

/** Static placeholders until a notifications backend exists. */
const NOTIFICATIONS = [
  { title: "New schedule published", time: "5 minutes ago", date: "13 JUL" },
  { title: "Room conflict detected", time: "18 minutes ago", date: "13 JUL" },
  { title: "Faculty load report ready", time: "1 hour ago", date: "12 JUL" },
];

const iconButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-full text-navy-700 transition-colors duration-150 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-200 dark:hover:bg-white/10";

const menuItemClassName =
  "flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left font-body text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white";

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

      <ThemeToggle
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border border-slate-300/70 bg-white/60 text-navy-600 transition-colors duration-150 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:bg-white/5 dark:text-gold-300 dark:hover:bg-white/10"
        iconSize={16}
      />

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
          className="w-80"
        >
          {(close) => (
            <>
              <div className="border-b border-slate-100 px-4 py-2.5 font-body text-sm font-semibold text-slate-800 dark:border-white/10 dark:text-white">
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
          className="w-60"
        >
          {(close) => (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-3.5 pb-2.5 pt-1.5 dark:border-white/10">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-navy-800 font-body text-sm font-medium text-white dark:bg-white dark:text-navy-900"
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
                <UserIcon /> Profile
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClassName}
                onClick={() => {
                  close();
                  navigate("/settings/security");
                }}
              >
                <KeyIcon /> Security
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClassName}
                onClick={() => {
                  close();
                  navigate("/settings/appearance");
                }}
              >
                <PaletteIcon /> Appearance
              </button>
              <button
                type="button"
                role="menuitem"
                className={`${menuItemClassName} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10`}
                onClick={() => {
                  close();
                  handleLogout();
                }}
              >
                <LogoutIcon /> Log out
              </button>
            </>
          )}
        </Popover>
      )}
    </header>
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
