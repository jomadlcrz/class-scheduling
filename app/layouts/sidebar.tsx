import { type ComponentType, useState } from "react";
import { NavLink, useLocation } from "react-router";
import {
  AlertTriangleIcon,
  BookIcon,
  BookOpenIcon,
  BuildingIcon,
  CalendarIcon,
  ChartIcon,
  ChevronRightIcon,
  DashboardIcon,
  DoorIcon,
  FolderIcon,
  GraduationCapIcon,
  LayersIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from "../components/ui/icons";
import { useAuth } from "../hooks/use-auth";
import type { Role } from "../types/user";

type NavItem = {
  label: string;
  /** Omit on parent items that only toggle a submenu. */
  href?: string;
  icon: ComponentType;
  /** Restrict visibility to these roles; omitted = visible to everyone. */
  roles?: Role[];
  /** Route not built yet — rendered disabled with a "Soon" tag. */
  soon?: boolean;
  /** Collapsible submenu entries; when present the item toggles instead of navigating. */
  children?: { label: string; href: string }[];
};

type NavSection = {
  heading?: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: DashboardIcon }],
  },
  {
    heading: "Scheduling",
    items: [
      {
        label: "Schedules",
        icon: CalendarIcon,
        roles: ["admin", "registrar", "dean"],
        children: [
          { label: "Weekly Hours", href: "/schedules/weekly-hours" },
          { label: "Regular Class", href: "/schedules/regular-class" },
          { label: "Irregular Class", href: "/schedules/irregular-class" },
        ],
      },
      {
        label: "My Schedule",
        href: "/faculty-schedule",
        icon: CalendarIcon,
        roles: ["faculty"],
      },
      {
        label: "My Schedule",
        href: "/student-schedule",
        icon: CalendarIcon,
        roles: ["student"],
      },
      {
        label: "Conflicts",
        href: "/conflicts",
        icon: AlertTriangleIcon,
        roles: ["admin", "registrar", "dean", "faculty"],
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
      {
        label: "Overview",
        href: "/facilities",
        icon: ChartIcon,
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
      },
    ],
  },
  {
    heading: "Students",
    items: [
      {
        label: "Students",
        href: "/students",
        icon: GraduationCapIcon,
        roles: ["admin", "registrar"],
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
  {
    items: [
      { label: "Settings", href: "/settings", icon: SettingsIcon },
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
              <p className="mb-2 px-3 font-sans text-[0.65rem] font-medium uppercase tracking-wider text-[#afc4ff]">
                {section.heading}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => (
                <li key={item.href ?? item.label}>
                  {item.children ? (
                    <NavGroup item={item} onNavigate={onNavigate} />
                  ) : (
                    <NavEntry item={item} onNavigate={onNavigate} />
                  )}
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
      <div aria-disabled="true" className={`${entryClassName} cursor-default text-white/50`}>
        <Icon />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-full border border-white/20 px-1.5 py-0.5 font-sans text-[0.6rem] uppercase tracking-wide text-white/50">
          Soon
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={item.href!}
      onClick={onNavigate}
      className={({ isActive }) =>
        `${entryClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
          isActive
            ? "bg-[#1e5bff] text-white"
            : "text-white/85 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      <Icon />
      {item.label}
    </NavLink>
  );
}

const childLinkClassName = (isActive: boolean) =>
  `flex items-center rounded-lg py-2 pl-11 pr-3 font-sans text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
    isActive
      ? "bg-[#1e5bff] text-white"
      : "text-white/80 hover:bg-white/10 hover:text-white"
  }`;

/** Collapsible parent item that toggles a submenu instead of navigating. */
function NavGroup({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  const { pathname } = useLocation();
  const children = item.children ?? [];
  const hasActiveChild = children.some(
    (child) => pathname === child.href || pathname.startsWith(`${child.href}/`),
  );
  const [open, setOpen] = useState(hasActiveChild);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`${entryClassName} w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
          hasActiveChild
            ? "text-white"
            : "text-white/85 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon />
        <span className="flex-1 text-left">{item.label}</span>
        <span
          className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          <ChevronRightIcon />
        </span>
      </button>
      {open && (
        <ul className="mt-0.5 flex flex-col gap-0.5">
          {children.map((child) => (
            <li key={child.href}>
              <NavLink
                to={child.href}
                onClick={onNavigate}
                className={({ isActive }) => childLinkClassName(isActive)}
              >
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
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
        <span className="font-display text-2xl tracking-wide text-white">
          GWC
        </span>
        <span className="-mt-1.5 font-sans text-[0.6rem] tracking-wide text-[#afc4ff]">
          Class Scheduling
        </span>
      </span>
    </div>
  );
}

/** Desktop-only sidebar; mobile uses the MobileNav drawer instead. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/10 bg-linear-to-b from-[#0b3b9e] to-[#072b75] lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
        <SidebarBrand />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5 text-white">
        <SidebarNav />
      </div>
    </aside>
  );
}
