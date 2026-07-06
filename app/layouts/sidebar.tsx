import { motion } from "motion/react";
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
  LayoutIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from "../components/ui/icons";
import { Tooltip } from "../components/ui/tooltip";
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
    heading: "Overview",
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
        label: "Classroom Mapping",
        href: "/classroom-mapping",
        icon: LayoutIcon,
        roles: ["admin", "registrar", "dean"],
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

type NavContext = {
  onNavigate?: () => void;
  /** Icon-only rail; only ever true for the desktop sidebar, never the mobile drawer. */
  collapsed: boolean;
  /** Expand the sidebar first, then reveal the clicked submenu (icon-only rail). */
  onExpand?: () => void;
};

/** Nav list shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({
  onNavigate,
  collapsed = false,
  onExpand,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onExpand?: () => void;
}) {
  const { user } = useAuth();
  const role = user?.role;
  const ctx: NavContext = { onNavigate, collapsed, onExpand };

  return (
    <nav className="flex flex-col gap-6" aria-label="Main navigation">
      {NAV_SECTIONS.map((section) => {
        const items = section.items.filter(
          (item) => !item.roles || (role && item.roles.includes(role)),
        );
        if (items.length === 0) return null;

        return (
          <div key={section.heading ?? "overview"}>
            {section.heading && !collapsed && (
              <p className="mb-2 px-3 font-sans text-[0.65rem] font-semibold uppercase tracking-wider text-[#afc4ff]">
                {section.heading}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => (
                <li key={item.href ?? item.label}>
                  {item.children ? (
                    <NavGroup item={item} ctx={ctx} />
                  ) : (
                    <NavEntry item={item} ctx={ctx} />
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
  "flex items-center gap-3 rounded-lg px-3 py-2 font-sans text-[0.82rem] transition-colors duration-150";

function NavEntry({ item, ctx }: { item: NavItem; ctx: NavContext }) {
  const Icon = item.icon;
  const { collapsed, onNavigate } = ctx;

  if (item.soon) {
    return (
      <Tooltip label={`${item.label} (Soon)`} direction="right" gap={10} disabled={!collapsed}>
        <div
          aria-disabled="true"
          className={`${entryClassName} cursor-default text-white/50 ${collapsed ? "justify-center px-0" : ""}`}
        >
          <Icon />
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              <span className="rounded-full border border-white/20 px-1.5 py-0.5 font-sans text-[0.6rem] uppercase tracking-wide text-white/50">
                Soon
              </span>
            </>
          )}
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={item.label} direction="right" gap={10} disabled={!collapsed}>
      <NavLink
        to={item.href!}
        onClick={onNavigate}
        className={({ isActive }) =>
          `relative ${entryClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${collapsed ? "justify-center px-0" : ""} ${
            isActive
              ? `bg-[#1e5bff] text-white ${!collapsed ? "before:absolute before:-left-1.5 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded before:bg-white" : ""}`
              : "text-white/85 hover:bg-white/10 hover:text-white"
          }`
        }
      >
        <Icon />
        {!collapsed && item.label}
      </NavLink>
    </Tooltip>
  );
}

const childLinkClassName = (isActive: boolean) =>
  `block truncate rounded-lg px-3 py-1.5 font-sans text-[0.8rem] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
    isActive
      ? "bg-[#1e5bff] text-white"
      : "text-white/80 hover:bg-white/10 hover:text-white"
  }`;

/** Collapsible parent item that toggles a submenu instead of navigating. */
function NavGroup({ item, ctx }: { item: NavItem; ctx: NavContext }) {
  const Icon = item.icon;
  const { pathname } = useLocation();
  const { collapsed, onExpand, onNavigate } = ctx;
  const children = item.children ?? [];
  const hasActiveChild = children.some(
    (child) => pathname === child.href || pathname.startsWith(`${child.href}/`),
  );
  const [open, setOpen] = useState(hasActiveChild);
  const showSubmenu = open && !collapsed;

  function handleToggle() {
    if (collapsed) {
      onExpand?.();
      setOpen(true);
      return;
    }
    setOpen((v) => !v);
  }

  return (
    <div>
      <Tooltip label={item.label} direction="right" gap={10} disabled={!collapsed}>
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={showSubmenu}
          className={`${entryClassName} w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${collapsed ? "justify-center px-0" : ""} ${
            hasActiveChild
              ? "text-white"
              : "text-white/85 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <span
                className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                aria-hidden="true"
              >
                <ChevronRightIcon />
              </span>
            </>
          )}
        </button>
      </Tooltip>
      {showSubmenu && (
        <ul className="ml-[1.35rem] mt-0.5 flex flex-col gap-0.5 border-l border-white/15 pl-2.5">
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
export function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/images/logos/gwc-logo.avif"
        alt="GWC logo"
        width={36}
        height={36}
        loading="eager"
        className="size-9 shrink-0 object-contain"
      />
      {!collapsed && (
        <span className="flex flex-col items-center text-center leading-none">
          <span className="font-display text-2xl tracking-wide text-white">
            GWC
          </span>
          <span className="-mt-1.5 font-sans text-[0.6rem] tracking-wide text-[#afc4ff]">
            Class Scheduling
          </span>
        </span>
      )}
    </div>
  );
}

type SidebarProps = {
  collapsed: boolean;
  onExpand: () => void;
};

/** Desktop-only sidebar; mobile uses the MobileNav drawer instead. */
export function Sidebar({ collapsed, onExpand }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 256 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-white/10 bg-linear-to-b from-[#0b3b9e] to-[#072b75] lg:flex"
    >
      <div
        className={`flex h-12 shrink-0 items-center border-b border-white/10 ${collapsed ? "justify-center px-0" : "px-5"}`}
      >
        <SidebarBrand collapsed={collapsed} />
      </div>
      <div className={`flex-1 overflow-y-auto scrollbar-none py-5 text-white ${collapsed ? "px-1.5" : "px-3"}`}>
        <SidebarNav collapsed={collapsed} onExpand={onExpand} />
      </div>
    </motion.aside>
  );
}
