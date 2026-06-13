import type { ComponentType } from "react";
import { NavLink } from "react-router";
import {
  AlertTriangleIcon,
  BookIcon,
  BookOpenIcon,
  BuildingIcon,
  CalendarIcon,
  ChartIcon,
  DashboardIcon,
  DoorIcon,
  FolderIcon,
  GraduationCapIcon,
  LayersIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from "../components/ui/icons";
import { useAuth } from "../hooks/use-auth";
import type { Role } from "../types/user";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType;
  /** Restrict visibility to these roles; omitted = visible to everyone. */
  roles?: Role[];
  /** Route not built yet — rendered disabled with a "Soon" tag. */
  soon?: boolean;
};

type NavSection = {
  heading?: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: DashboardIcon }],
  },
  {
    heading: "Scheduling",
    items: [
      { label: "Schedules", href: "/schedules", icon: CalendarIcon, soon: true },
      {
        label: "Conflicts",
        href: "/conflicts",
        icon: AlertTriangleIcon,
        roles: ["admin", "registrar", "dean", "faculty"],
        soon: true,
      },
    ],
  },
  {
    heading: "Academics",
    items: [
      {
        label: "Curriculum",
        href: "/curriculum",
        icon: BookOpenIcon,
        roles: ["admin", "registrar", "dean"],
        soon: true,
      },
      {
        label: "Departments",
        href: "/departments",
        icon: FolderIcon,
        roles: ["admin", "registrar", "dean"],
      },
      {
        label: "Programs",
        href: "/programs",
        icon: GraduationCapIcon,
        roles: ["admin", "registrar", "dean"],
      },
      {
        label: "Subjects",
        href: "/subjects",
        icon: BookIcon,
        roles: ["admin", "registrar", "dean"],
      },
      {
        label: "Sets",
        href: "/sets",
        icon: LayersIcon,
        roles: ["admin", "registrar", "dean"],
      },
      {
        label: "Faculty",
        href: "/faculty",
        icon: UsersIcon,
        roles: ["admin", "registrar", "dean"],
      },
    ],
  },
  {
    heading: "Facilities",
    items: [
      {
        label: "Buildings",
        href: "/buildings",
        icon: BuildingIcon,
        roles: ["admin", "registrar"],
      },
      {
        label: "Rooms",
        href: "/rooms",
        icon: DoorIcon,
        roles: ["admin", "registrar"],
      },
    ],
  },
  {
    heading: "Insights",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: ChartIcon,
        roles: ["admin", "registrar", "dean"],
        soon: true,
      },
    ],
  },
  {
    heading: "Administration",
    items: [
      { label: "Users", href: "/users", icon: UserIcon, roles: ["admin"] },
      { label: "Roles", href: "/roles", icon: ShieldIcon, roles: ["admin"] },
    ],
  },
];

/** Nav list shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <nav className="flex flex-col gap-6" aria-label="Main navigation">
      {NAV_SECTIONS.map((section) => {
        const items = section.items.filter(
          (item) => !item.roles || (role && item.roles.includes(role)),
        );
        if (items.length === 0) return null;

        return (
          <div key={section.heading ?? "overview"}>
            {section.heading && (
              <p className="mb-2 px-3 font-sans text-[0.65rem] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.heading}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => (
                <li key={item.href}>
                  <NavEntry item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

const entryClassName =
  "flex items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm transition-colors duration-150";

function NavEntry({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;

  if (item.soon) {
    return (
      <div aria-disabled="true" className={`${entryClassName} cursor-default text-slate-400 dark:text-slate-600`}>
        <Icon />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-full border border-slate-200 px-1.5 py-0.5 font-sans text-[0.6rem] uppercase tracking-wide text-slate-400 dark:border-white/10 dark:text-slate-500">
          Soon
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={item.href}
      onClick={onNavigate}
      className={({ isActive }) =>
        `${entryClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
          isActive
            ? "bg-navy-800 text-white dark:bg-white/10"
            : "text-slate-600 hover:bg-slate-200/60 hover:text-navy-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
        }`
      }
    >
      <Icon />
      {item.label}
    </NavLink>
  );
}

/** Brand block at the top of the sidebar and mobile drawer. */
export function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/images/logos/gwc-logo.avif"
        alt="GWC logo"
        width={36}
        height={36}
        loading="eager"
        className="size-9 object-contain"
      />
      <span className="flex flex-col items-center text-center leading-none">
        <span className="font-display text-2xl tracking-wide text-navy-700 dark:text-white">
          GWC
        </span>
        <span className="-mt-1.5 font-sans text-[0.6rem] tracking-wide text-navy-500 dark:text-navy-300">
          Class Scheduling
        </span>
      </span>
    </div>
  );
}

/** Desktop-only sidebar; mobile uses the MobileNav drawer instead. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white/60 lg:flex dark:border-white/10 dark:bg-navy-900/60">
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5 dark:border-white/10">
        <SidebarBrand />
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5 text-slate-400 dark:text-slate-500">
        <SidebarNav />
      </div>
    </aside>
  );
}
