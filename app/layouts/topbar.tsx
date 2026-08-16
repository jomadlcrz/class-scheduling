import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  ChevronDownIcon,
  HelpCircleIcon,
  KeyIcon,
  LogoutIcon,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
  UserIcon,
} from "~/components/ui/icons";
import { Popover } from "~/components/ui/popover";
import { NotificationBell } from "~/features/notifications/notification-bell";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { useTheme, type ThemePreference } from "~/hooks/use-theme";
import type { ProfilePhotoData } from "~/services/profile-photo.service";
import { profilePhotoService } from "~/services/profile-photo.service";
import { NOTIFICATION_RECIPIENT_ROLES } from "~/types/notification";
import type { Role } from "~/types/user";

const iconButtonClassName =
  "flex cursor-pointer items-center rounded-lg px-1 py-1 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/8";

const menuItemClassName =
  "flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-md p-2.5 text-left font-body text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-mist-100 [&>svg]:size-3.5";

type TopbarAction = {
  label: string;
  to: string;
  roles: Role[];
};

type HelpAction = TopbarAction & {
  description: string;
};

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  registrar: "Registrar",
  dean: "Dean",
  faculty: "Faculty",
  student: "Student",
};

const CREATE_ACTIONS: TopbarAction[] = [
  { label: "New Administrator", to: "/administrators/new", roles: ["admin"] },
  { label: "New Faculty Account", to: "/faculty/new", roles: ["admin"] },
  { label: "New Enrollment", to: "/enrollment/new", roles: ["registrar"] },
  { label: "Re-enroll Student", to: "/enrollment/re-enroll", roles: ["registrar"] },
  { label: "New Curriculum", to: "/program-curricula/new", roles: ["registrar"] },
  { label: "New Facility", to: "/facilities/new", roles: ["registrar"] },
  { label: "New Schedule", to: "/schedules/new", roles: ["registrar"] },
];

const SEARCH_ACTIONS: TopbarAction[] = [
  { label: "Dashboard", to: "/dashboard", roles: ["admin", "registrar", "dean", "faculty", "student"] },
  { label: "Administrators", to: "/administrators", roles: ["admin"] },
  { label: "Faculty", to: "/faculty", roles: ["admin"] },
  { label: "Students", to: "/students", roles: ["admin"] },
  { label: "Roles & Permissions", to: "/permissions", roles: ["admin"] },
  { label: "Academic Terms", to: "/academic-terms/school-years", roles: ["registrar"] },
  { label: "Facilities", to: "/facilities", roles: ["registrar"] },
  { label: "Departments", to: "/departments", roles: ["registrar"] },
  { label: "Program Curricula", to: "/program-curricula", roles: ["registrar"] },
  { label: "Subject Assignments", to: "/subject-assignments", roles: ["registrar", "dean"] },
  { label: "Scheduling Hub", to: "/schedules", roles: ["registrar"] },
  { label: "Schedule Approvals", to: "/dean/schedule-approvals", roles: ["dean"] },
  { label: "Faculty Loads", to: "/faculty-loads", roles: ["dean"] },
  { label: "My Schedule", to: "/faculty-schedule", roles: ["faculty"] },
  { label: "Faculty Loading", to: "/faculty-loading", roles: ["faculty"] },
  { label: "My Schedule", to: "/student-schedule", roles: ["student"] },
];

const HELP_ACTIONS: HelpAction[] = [
  {
    label: "Manage user accounts",
    description: "Create accounts and maintain access permissions.",
    to: "/administrators",
    roles: ["admin"],
  },
  {
    label: "Review roles & permissions",
    description: "View the access assigned to each system role.",
    to: "/permissions",
    roles: ["admin"],
  },
  {
    label: "Set up academic records",
    description: "Manage terms, facilities, departments, and curricula.",
    to: "/academic-terms/school-years",
    roles: ["registrar"],
  },
  {
    label: "Build and manage schedules",
    description: "Assign instructors and prepare class schedules.",
    to: "/schedules",
    roles: ["registrar"],
  },
  {
    label: "Review schedule approvals",
    description: "Inspect and decide on submitted schedules.",
    to: "/dean/schedule-approvals",
    roles: ["dean"],
  },
  {
    label: "Review faculty loads",
    description: "Monitor teaching assignments and workloads.",
    to: "/faculty-loads",
    roles: ["dean"],
  },
  {
    label: "View my teaching schedule",
    description: "See your assigned classes and meeting times.",
    to: "/faculty-schedule",
    roles: ["faculty"],
  },
  {
    label: "Review my faculty load",
    description: "Check your subjects and assigned teaching load.",
    to: "/faculty-loading",
    roles: ["faculty"],
  },
  {
    label: "View my class schedule",
    description: "See your enrolled classes and meeting times.",
    to: "/student-schedule",
    roles: ["student"],
  },
];

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsRoute = location.pathname.startsWith("/settings");
  const { data: photoData, reload: reloadPhoto } = useCachedData<ProfilePhotoData>(
    "profile-photo",
    () => profilePhotoService.getPhoto(user!.role),
    { enabled: !!user },
  );
  const photoUrl = photoData?.profilePhotoUrl ?? null;
  const [searchOpen, setSearchOpen] = useState(false);
  const createActions = user ? CREATE_ACTIONS.filter((action) => action.roles.includes(user.role)) : [];
  const searchActions = user ? SEARCH_ACTIONS.filter((action) => action.roles.includes(user.role)) : [];
  const helpActions = user ? HELP_ACTIONS.filter((action) => action.roles.includes(user.role)) : [];

  useEffect(() => {
    const handler = () => reloadPhoto();
    window.addEventListener("profile-photo-changed", handler);
    return () => window.removeEventListener("profile-photo-changed", handler);
  }, [reloadPhoto]);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-35 flex h-12 shrink-0 items-center gap-2 border-b border-slate-300 bg-white/95 px-4 backdrop-blur-md sm:px-6 dark:border-white/8 dark:bg-surface/90">
      {/* Settings routes hide the main app Sidebar on desktop, so the toggle
          has nothing to do there — show the brand lockup instead. It still
          opens the mobile drawer below lg. */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle navigation menu"
        className={`${iconButtonClassName} lg:hidden`}
      >
        <span className="flex size-7 items-center justify-center">
          <MenuIcon />
        </span>
      </button>
      {isSettingsRoute && (
        <Link
          to="/dashboard"
          aria-label="GWC Class Scheduling — dashboard"
          className="hidden items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 lg:flex"
        >
          <img
            src="/images/logos/gwc-logo.avif"
            alt="GWC logo"
            width={28}
            height={28}
            className="size-7 object-contain"
          />
          <span className="flex flex-col items-center text-center leading-none">
            <span className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
              GWC
            </span>
            <span className="-mt-1 font-body text-[0.65rem] tracking-wide text-navy-500 dark:text-navy-300">
              Class Scheduling
            </span>
          </span>
        </Link>
      )}

      <div className="flex-1 lg:hidden" />

      {user && (
        <div className="hidden shrink-0 items-center gap-2 font-body lg:flex">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Role
          </span>
          <span className="text-slate-300 dark:text-white/15">/</span>
          <span className="text-sm font-semibold text-navy-700 dark:text-mist-100">
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      )}

      <div className="hidden min-w-0 flex-1 justify-end lg:flex">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-8 w-full max-w-sm cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 text-left font-body text-sm text-slate-400 transition-colors hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 dark:hover:border-white/20 dark:hover:bg-white/8"
        >
          <SearchIcon />
          <span className="min-w-0 flex-1 truncate">Search pages...</span>
          <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 font-body text-[10px] text-slate-400 xl:inline dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
            Ctrl K
          </kbd>
        </button>
      </div>

      {user && createActions.length > 0 && (
        <Popover
          label="Open create menu"
          trigger={
            <span className="flex h-8 items-center gap-1.5 px-1.5 font-body text-sm font-semibold">
              <PlusIcon />
              <span>Create</span>
              <ChevronDownIcon />
            </span>
          }
          triggerClassName="hidden cursor-pointer items-center rounded-lg bg-navy-800 text-mist-100 transition-colors duration-150 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 lg:flex dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
          className="w-56 px-1.5"
        >
          {(close) => (
            <div className="py-1">
              {createActions.map((action) => (
                <button
                  key={action.to}
                  type="button"
                  role="menuitem"
                  className={menuItemClassName}
                  onClick={() => {
                    close();
                    navigate(action.to);
                  }}
                >
                  {action.label}
                  <PlusIcon />
                </button>
              ))}
            </div>
          )}
        </Popover>
      )}

      {user && helpActions.length > 0 && (
        <Popover
          label={`Open ${ROLE_LABELS[user.role].toLowerCase()} help menu`}
          trigger={
            <span className="flex size-7 items-center justify-center">
              <HelpCircleIcon />
            </span>
          }
          triggerClassName={`${iconButtonClassName} hidden lg:flex`}
          className="w-80 px-1.5"
        >
          {(close) => (
            <div className="py-1 font-body">
              <div className="border-b border-slate-100 px-2.5 pb-2.5 pt-1.5 dark:border-white/10">
                <p className="text-sm font-semibold text-slate-800 dark:text-mist-100">
                  {ROLE_LABELS[user.role]} help
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Quick access to your main workspace tasks.
                </p>
              </div>
              <div className="py-1">
                {helpActions.map((action) => (
                  <button
                    key={action.to}
                    type="button"
                    role="menuitem"
                    className="w-full cursor-pointer rounded-md px-2.5 py-2 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/5"
                    onClick={() => {
                      close();
                      navigate(action.to);
                    }}
                  >
                    <span className="block text-sm font-medium text-slate-700 dark:text-mist-100">
                      {action.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      {action.description}
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 px-2.5 py-2.5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                <div className="flex items-center justify-between gap-3">
                  <span>Search and open a page</span>
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] dark:border-white/10 dark:bg-white/5">
                    Ctrl K
                  </kbd>
                </div>
              </div>
            </div>
          )}
        </Popover>
      )}

      {user && NOTIFICATION_RECIPIENT_ROLES.includes(user.role) && <NotificationBell />}

      {user && (
        <Popover
          label="Open user menu"
          trigger={
            <span className="flex items-center">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  aria-hidden="true"
                  className="size-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-800 font-body text-xs font-medium text-mist-100 dark:bg-white dark:text-navy-800"
                >
                  {initials(user.name)}
                </span>
              )}
            </span>
          }
          triggerClassName="ml-1 flex cursor-pointer items-center rounded-full p-1 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/8"
          className="w-72 px-1.5"
        >
          {(close) => (
            <>
              <div className="mb-1 flex items-center gap-3 border-b border-slate-100 px-2.5 pb-3 pt-2 dark:border-white/10">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt=""
                    aria-hidden="true"
                    className="size-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-800 font-body text-base font-medium text-mist-100 dark:bg-white dark:text-navy-800"
                  >
                    {initials(user.name)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-semibold text-slate-800 dark:text-mist-100">
                    {user.name}
                  </p>
                  <a href={`mailto:${user.email}`} className="truncate font-body text-xs text-slate-500 hover:underline dark:text-slate-400">
                    {user.email}
                  </a>
                </div>
              </div>
              <button
                type="button"
                role="menuitem"
                className={menuItemClassName}
                onClick={() => {
                  close();
                  navigate("/settings/account-details");
                }}
              >
                Account Details <UserIcon />
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
                Password <KeyIcon />
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

      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Search navigation"
        description="Search for a page to open."
      >
        <CommandInput placeholder="Search pages..." autoFocus />
        <CommandList>
          <CommandEmpty>No pages found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {searchActions.map((action) => (
              <CommandItem
                key={action.to}
                value={action.label}
                onSelect={() => {
                  setSearchOpen(false);
                  navigate(action.to);
                }}
              >
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
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
                  ? "bg-navy-800 text-mist-100 dark:bg-white dark:text-navy-800"
                  : "text-slate-400 hover:text-navy-700 dark:text-slate-500 dark:hover:text-mist-100"
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

function initials(name: string): string {
  return name
    .split(" ")[0]?.[0]
    ?.toUpperCase() ?? "";
}
