import { Link, useNavigate } from "react-router";
import { ThemeToggle } from "../components/theme/theme-toggle";
import { LogoutIcon, MenuIcon } from "../components/ui/icons";
import { useAuth } from "../hooks/use-auth";

const iconButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-full text-navy-700 transition-colors duration-150 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-200 dark:hover:bg-white/10";

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
        <Link
          to="/settings/profile"
          className="ml-1 flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/8"
          title="Account settings"
        >
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-800 font-body text-xs font-medium text-white dark:bg-white dark:text-navy-900"
          >
            {initials(user.name)}
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-body text-sm font-medium text-navy-700 dark:text-white">
              {user.name}
            </span>
            <span className="font-body text-xs capitalize text-slate-500 dark:text-slate-400">
              {user.role}
            </span>
          </span>
        </Link>
      )}

      <button
        type="button"
        onClick={handleLogout}
        aria-label="Log out"
        title="Log out"
        className={iconButtonClassName}
      >
        <LogoutIcon />
      </button>
    </header>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
