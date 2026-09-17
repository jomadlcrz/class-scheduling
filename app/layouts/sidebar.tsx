import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import {
  AuditLogIcon,
  BookOpenIcon,
  Building2Icon,
  CalendarCheckIcon,
  CalendarClockIcon,
  CalendarIcon,
  CalendarShuffleIcon,
  ChevronRightIcon,
  ClockIcon,
  DashboardIcon,
  FileTextIcon,
  FlaskConicalIcon,
  FolderOpenIcon,
  GraduationCapIcon,
  LayersIcon,
  LayoutSidebarIcon,
  MapIcon,
  RefreshCwIcon,
  SchedulingHubIcon,
  ShieldIcon,
  ShieldUserIcon,
  UserCheckIcon,
  UserIcon,
  UsersIcon,
  UsersRoundIcon
} from "~/components/ui/icons";
import { Popover } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { useDeanPendingApprovalsCount } from "~/features/dean-approvals/use-dean-pending-count";
import { useRegistrarPendingScheduleCount } from "~/features/schedules/use-registrar-pending-count";
import { useAuth } from "~/hooks/use-auth";
import type { Role } from "~/types/user";

/** Nav item that carries a live pending-count badge (dean's department schedules). */
const DEPARTMENT_SCHEDULES_PATH = "/dean/department-schedules";

/** Nav item that carries a live pending-count badge (registrar scheduling hub). */
const SCHEDULING_HUB_PATH = "/schedules";

const ALL_ROLES: Role[] = ["admin", "registrar", "dean", "faculty", "student"];

export type SidebarMode = "expanded" | "collapsed" | "expand-on-hover";

const SIDEBAR_MODE_KEY = "cs-sidebar-mode";
const LEGACY_COLLAPSED_KEY = "cs-sidebar-collapsed";

const SIDEBAR_MODE_OPTIONS: { value: SidebarMode; label: string }[] = [
  { value: "expanded", label: "Expanded" },
  { value: "collapsed", label: "Collapsed" },
  { value: "expand-on-hover", label: "Expand on hover" },
];

export function loadSidebarMode(): SidebarMode {
  try {
    const stored = localStorage.getItem(SIDEBAR_MODE_KEY);
    if (stored === "expanded" || stored === "collapsed" || stored === "expand-on-hover") {
      return stored;
    }
    if (localStorage.getItem(LEGACY_COLLAPSED_KEY) === "1") return "collapsed";
  } catch {
    // storage unavailable
  }
  return "expanded";
}

export function saveSidebarMode(mode: SidebarMode): void {
  try {
    localStorage.setItem(SIDEBAR_MODE_KEY, mode);
  } catch {
    // storage unavailable
  }
}


type NavLeaf = {
  label: string;
  to: string;
  roles: Role[];
  matchPrefix?: boolean;
  matchPaths?: string[];
};

type NavItem = NavLeaf & { icon: ReactNode; subItems?: undefined };
type NavSubmenu = {
  label: string;
  icon: ReactNode;
  roles: Role[];
  subItems: NavLeaf[];
  to?: undefined;
};
type NavEntry = NavItem | NavSubmenu;
type NavGroup = { label: string; items: NavEntry[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: <DashboardIcon />, roles: ALL_ROLES }],
  },
  {
    // Step 1 — everything configured before building timetables.
    label: "Term Setup",
    items: [
      {
        label: "Academic Terms",
        to: "/academic-terms",
        icon: <CalendarIcon />,
        roles: ["registrar"],
        matchPrefix: true,
      },
      { label: "Weekly Hour Allocations", to: "/schedules/weekly-hour-allocations", icon: <CalendarClockIcon />, roles: ["registrar"] },
      { label: "Class Delivery Modes", to: "/schedules/class-mode-policies", icon: <LayersIcon />, roles: ["registrar"] },
    ],
  },
  {
    label: "Curriculum & Facilities",
    items: [
      {
        label: "Facilities",
        to: "/facilities",
        icon: <Building2Icon />,
        roles: ["registrar"],
        matchPaths: ["/facilities"],
      },
      { label: "Departments", to: "/departments", icon: <FolderOpenIcon />, roles: ["registrar"] },
      { label: "Program Curricula", to: "/program-curricula", icon: <BookOpenIcon />, roles: ["registrar"], matchPrefix: true },
      { label: "Sets", to: "/sets", icon: <LayersIcon />, roles: ["registrar"] },
    ],
  },
  {
    // Advisory capacity tools — shared with the dean.
    label: "Rooms & Capacity",
    items: [
      { label: "Classroom Mapping", to: "/classroom-mapping", icon: <MapIcon />, roles: ["dean", "registrar"] },
      { label: "Laboratory Analysis", to: "/schedules/lab-analysis", icon: <FlaskConicalIcon />, roles: ["registrar"] },
    ],
  },
  {
    label: "Academic Community",
    items: [
      { label: "Administrators", to: "/administrators", icon: <ShieldUserIcon />, roles: ["admin"], matchPrefix: true },
      { label: "Faculty", to: "/faculty", icon: <UserIcon />, roles: ["admin"], matchPrefix: true },
      { label: "Students", to: "/students", icon: <UsersIcon />, roles: ["admin"], matchPaths: ["/students", "/students-regular", "/students-irregular"] },
    ],
  },
  {
    label: "Enrollment",
    items: [
      {
        label: "Enrollment Records",
        to: "/enrollment/students",
        icon: <UsersIcon />,
        roles: ["registrar"],
        matchPaths: ["/enrollment/students", "/enrollment/regular-students", "/enrollment/irregular-students"],
      },
      { label: "New Enrollment", to: "/enrollment/new", icon: <GraduationCapIcon />, roles: ["registrar"] },
      { label: "Re-enroll Student", to: "/enrollment/re-enroll", icon: <RefreshCwIcon />, roles: ["registrar"] },
    ],
  },
  {
    // Timetable pipeline + personal schedules.
    label: "Scheduling",
    items: [
      {
        label: "Scheduling Hub",
        to: "/schedules",
        icon: <SchedulingHubIcon />,
        roles: ["registrar"],
        matchPaths: [
          "/schedules",
          "/schedules/regular-class",
          "/schedules/irregular-class",
          "/schedules/new",
          "/schedules/adjustment-board",
        ],
      },
      { label: "Scheduling Calendar", to: "/schedules/term-calendar", icon: <CalendarIcon />, roles: ["registrar"] },
      { label: "Subject Offering", to: "/subject-offering", icon: <UserCheckIcon />, roles: ["registrar"] },
      { label: "Assignment Audit Logs", to: "/subject-offering/audit-logs", icon: <AuditLogIcon />, roles: ["registrar"] },
      { label: "Major Schedules", to: "/major-schedules", icon: <CalendarCheckIcon />, roles: ["registrar"] },
      { label: "Schedule Responses", to: "/schedule-responses", icon: <CalendarClockIcon />, roles: ["registrar"] },
      { label: "My Subjects", to: "/faculty/my-subjects", icon: <BookOpenIcon />, roles: ["faculty"] },
      { label: "My Availability", to: "/faculty/my-availability", icon: <CalendarCheckIcon />, roles: ["faculty"] },
      { label: "My Schedule", to: "/faculty-schedule", icon: <CalendarIcon />, roles: ["faculty"] },
      { label: "Faculty Loading", to: "/faculty-loading", icon: <CalendarIcon />, roles: ["faculty"] },
      { label: "Shift Requests", to: "/shift-requests", icon: <CalendarClockIcon />, roles: ["faculty"], matchPrefix: true },
      { label: "My Schedule", to: "/student-schedule", icon: <CalendarIcon />, roles: ["student"] },
      { label: "Registration (COR)", to: "/registration", icon: <FileTextIcon />, roles: ["student"] },
    ],
  },
  {
    label: "My Department",
    items: [
      { label: "Department Schedules", to: "/dean/department-schedules", icon: <FolderOpenIcon />, roles: ["dean"], matchPrefix: true },
      { label: "Faculty Loads", to: "/faculty-loads", icon: <UsersIcon />, roles: ["dean"] },
      { label: "Subject Offering", to: "/subject-offering", icon: <UserCheckIcon />, roles: ["dean"] },
      { label: "Assignment Audit Logs", to: "/subject-offering/audit-logs", icon: <AuditLogIcon />, roles: ["dean"] },
      { label: "Major Schedules", to: "/major-schedules", icon: <CalendarCheckIcon />, roles: ["dean"] },
      { label: "Schedule Responses", to: "/schedule-responses", icon: <CalendarClockIcon />, roles: ["dean"] },
      { label: "Curriculum", to: "/dean/subjects", icon: <BookOpenIcon />, roles: ["dean"] },
      { label: "Instructors", to: "/dean/instructors", icon: <UsersRoundIcon />, roles: ["dean"] },
      {
        label: "Instructor Availability",
        to: "/dean/instructor-availability",
        icon: <CalendarCheckIcon />,
        roles: ["dean", "registrar"],
      },
      { label: "Students", to: "/enrollment/students", icon: <UsersIcon />, roles: ["dean"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Roles & Permissions", to: "/permissions", icon: <ShieldIcon />, roles: ["admin"] },
      { label: "Audit Log", to: "/audit", icon: <AuditLogIcon />, roles: ["admin"] },
      { label: "Developer Tools", to: "/settings/dev-tools", icon: <RefreshCwIcon />, roles: ["admin"] },
    ],
  },
];

const itemClassName = (isActive: boolean) =>
  `group flex h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-body text-[0.78rem] text-mist-100/95 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
    isActive ? "bg-gwc-blue-bright font-extrabold" : "hover:bg-gwc-blue-bright"
  }`;

// Collapsed centers the icon; expand-on-hover keeps the icon at the same spot
// and only slides the label in (nav px-1 + centered 20px icon == nav px-2 + pl-3).
const itemPad = (collapsed: boolean, floating: boolean) =>
  floating ? "justify-start pl-3 pr-2" : collapsed ? "justify-center px-0" : "";

const widthSpring = { type: "spring", stiffness: 300, damping: 32, mass: 0.9 } as const;
const labelIn = { duration: 0.16, ease: "easeOut", delay: 0.04 } as const;
const headerFade = { duration: 0.18, ease: "easeOut" } as const;
// Expand-on-hover uses a quick, polished reveal inspired by social app sidebars.
const hoverWidth = { duration: 0.24, ease: [0.22, 1, 0.36, 1] } as const;
const hoverLabelIn = { duration: 0.18, ease: "easeOut", delay: 0.03 } as const;
const hoverHeader = { duration: 0.16, ease: "easeOut" } as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
} as const;

const submenuVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
} as const;

const subItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, type: "spring", stiffness: 260, damping: 24 } as const,
  }),
};

function isLeafActive(pathname: string, leaf: NavLeaf): boolean {
  if (leaf.matchPaths) {
    return leaf.matchPaths.some((p) => pathname === p);
  }
  if (leaf.matchPrefix) {
    return pathname === leaf.to || pathname.startsWith(`${leaf.to}/`);
  }
  return pathname === leaf.to;
}

/** Submenu leaves use exact matching so sibling routes don't all light up. */
function isSubItemActive(pathname: string, sub: NavLeaf): boolean {
  if (pathname === sub.to || pathname.startsWith(`${sub.to}/`)) return true;
  return sub.matchPaths?.some((p) => pathname === p) ?? false;
}

type SidebarProps = {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  onExpand: () => void;
  onNavigate: () => void;
  /** Mobile drawer always renders expanded regardless of the persisted mode. */
  forceExpanded?: boolean;
};

export function Sidebar({ mode, onModeChange, onExpand, onNavigate, forceExpanded = false }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const pendingApprovals = useDeanPendingApprovalsCount();
  const pendingSchedules = useRegistrarPendingScheduleCount();
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [hoverExpanded, setHoverExpanded] = useState(false);

  const collapsed = forceExpanded
    ? false
    : mode === "collapsed" || (mode === "expand-on-hover" && !hoverExpanded);
  // Expand-on-hover floats the aside at all times (fixed, width 60↔220) so it
  // overlays the topbar/content without reflowing them — and never toggles
  // between static/fixed, which makes the browser adjust the page scroll.
  const floating = !forceExpanded && mode === "expand-on-hover";
  const hoverAnimated = mode === "expand-on-hover";
  const headerClassName = floating
    ? "flex items-center gap-2 px-3 pb-2.5 pt-3.5"
    : `flex items-center px-3 pb-2.5 pt-3.5 ${collapsed ? "justify-center gap-0 px-0" : "gap-2"}`;
  const navPaddingClassName = floating ? "px-2" : collapsed ? "px-1" : "px-2";

  useEffect(() => {
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.subItems?.some((sub) => isSubItemActive(location.pathname, sub))) {
          setOpenSubmenus((current) =>
            current.includes(item.label) ? current : [...current, item.label],
          );
        }
      }
    }
  }, [location.pathname]);

  if (!user) return null;

  const hasRole = (roles: Role[]) => roles.includes(user.role);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => hasRole(item.roles))
      .map((item) =>
        item.subItems
          ? { ...item, subItems: item.subItems.filter((sub) => hasRole(sub.roles)) }
          : item,
      )
      .filter((item) => !item.subItems || item.subItems.length > 0),
  })).filter((group) => group.items.length > 0);

  function toggleSubmenu(label: string) {
    if (collapsed && !floating) onExpand();
    setOpenSubmenus((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }

  const isSubmenuOpen = (label: string) => !collapsed && openSubmenus.includes(label);

  const handleHoverEnter = () => {
    setHoverExpanded(true);
    if (floating) {
      setOpenSubmenus([]);
    }
  };

  const handleHoverLeave = () => {
    setHoverExpanded(false);
    if (floating) {
      setOpenSubmenus([]);
    }
  };

  return (
    <motion.aside
      aria-label="Portal navigation"
      onMouseEnter={handleHoverEnter}
      onMouseLeave={handleHoverLeave}
      animate={{ width: collapsed ? 60 : 220 }}
      transition={{
        width: hoverAnimated ? hoverWidth : widthSpring,
      }}
      className={`flex flex-col overflow-hidden border-r border-white/10 bg-gwc-blue-deep bg-linear-to-b from-gwc-blue to-gwc-blue-deep text-mist-100 ${
        floating ? "fixed inset-y-0 left-0 z-40" : "h-dvh"
      }`}
    >
      <header
        className={headerClassName}
      >
        <img
          src="/images/logos/gwc-logo.avif"
          alt="GWC logo"
          className="size-8 shrink-0 object-contain"
        />
        <motion.div
          initial={false}
          animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
          transition={{
            width: hoverAnimated ? hoverWidth : widthSpring,
            opacity: hoverAnimated ? hoverHeader : headerFade,
          }}
          className="min-w-0 overflow-hidden font-body leading-[1.05]"
        >
          <span className="block truncate text-[0.9rem] font-black">GWC</span>
          <span className="mt-0.5 block truncate border-t-2 border-white/20 pt-0.5 text-[0.9rem] font-black">
            Class Scheduling
          </span>
        </motion.div>
      </header>

      <nav
        aria-label="Sidebar navigation"
        className={`flex-1 overflow-y-auto pb-3 scrollbar-none ${navPaddingClassName}`}
      >
        {groups.map((group) => (
          <div key={group.label || "_"} className="mt-3 first:mt-1">
            <AnimatePresence mode="wait">
              {!collapsed && !floating && group.label && (
                <motion.p
                  key="group-label"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="px-1.5 pb-0.5 pt-1 font-body text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-gwc-blue-soft"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            <motion.ul
              className="flex flex-col gap-0.5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {group.items.map((item) =>
                item.subItems ? (
                  <motion.li key={item.label} variants={itemVariants}>
                    <Tooltip label={item.label} direction="right" gap={10} disabled={!collapsed}>
                      <button
                        type="button"
                        aria-expanded={openSubmenus.includes(item.label)}
                        onClick={() => toggleSubmenu(item.label)}
                        className={`${itemClassName(
                          item.subItems.some((sub) => isSubItemActive(location.pathname, sub)),
                        )} ${itemPad(collapsed, floating)}`}
                      >
                        <span className="grid size-5 shrink-0 place-items-center opacity-90">
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={hoverAnimated ? hoverLabelIn : labelIn}
                            className="flex min-w-0 flex-1 items-center gap-2"
                          >
                            <span className="min-w-0 flex-1 truncate text-left leading-none">{item.label}</span>
                            <motion.span
                              aria-hidden="true"
                              animate={{ rotate: openSubmenus.includes(item.label) ? 90 : 0 }}
                              transition={{ duration: 0.15 }}
                              className="shrink-0 opacity-70"
                            >
                              <ChevronRightIcon />
                            </motion.span>
                          </motion.span>
                        )}
                      </button>
                    </Tooltip>
                    <AnimatePresence initial={false}>
                      {isSubmenuOpen(item.label) && (
                        <motion.ul
                          key="submenu"
                          variants={submenuVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="ml-[1.15rem] mt-0.5 flex flex-col gap-0.5 overflow-hidden border-l border-white/15 pl-2"
                        >
                          {item.subItems.map((sub, i) => {
                            const active = isSubItemActive(location.pathname, sub);
                            return (
                              <motion.li
                                key={sub.to}
                                custom={i}
                                variants={subItemVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <NavLink
                                  to={sub.to}
                                  end
                                  onClick={onNavigate}
                                  className={`relative block truncate rounded-md px-2 py-1 font-body text-[0.75rem] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60 ${
                                    active
                                      ? "bg-gwc-blue-bright font-extrabold text-mist-100"
                                      : "text-mist-100/85 hover:bg-gwc-blue-bright hover:text-mist-100"
                                  }`}
                                >
                                  {sub.label}
                                </NavLink>
                              </motion.li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </motion.li>
                ) : (
                  <motion.li
                    key={`${item.label}-${item.to}`}
                    className="relative"
                    variants={itemVariants}
                  >
                    <Tooltip label={item.label} direction="right" gap={10} disabled={!collapsed}>
                      <NavLink
                        to={item.to}
                        end={!item.matchPrefix && !item.matchPaths}
                        onClick={onNavigate}
                        className={() => {
                          const active = isLeafActive(location.pathname, item);
                          return `${itemClassName(active)} ${itemPad(collapsed, floating)} ${
                            active && !collapsed
                              ? "before:absolute before:-left-1.5 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded before:bg-white"
                              : ""
                          }`;
                        }}
                      >
                        <span className="grid size-5 shrink-0 place-items-center opacity-90">
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={hoverAnimated ? hoverLabelIn : labelIn}
                            className="min-w-0 flex-1 truncate leading-none"
                          >
                            {item.label}
                          </motion.span>
                        )}
                        {!collapsed && item.to === DEPARTMENT_SCHEDULES_PATH && pendingApprovals > 0 && (
                          <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-white/20 px-1.5 py-0.5 font-body text-[0.7rem] font-bold leading-none tabular-nums text-mist-100">
                            {pendingApprovals}
                          </span>
                        )}
                        {!collapsed && item.to === SCHEDULING_HUB_PATH && pendingSchedules > 0 && (
                          <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-white/20 px-1.5 py-0.5 font-body text-[0.7rem] font-bold leading-none tabular-nums text-mist-100">
                            {pendingSchedules}
                          </span>
                        )}
                      </NavLink>
                    </Tooltip>
                    {collapsed && item.to === DEPARTMENT_SCHEDULES_PATH && pendingApprovals > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute right-1 top-1 size-2 rounded-full bg-white ring-2 ring-gwc-blue"
                      />
                    )}
                    {collapsed && item.to === SCHEDULING_HUB_PATH && pendingSchedules > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute right-1 top-1 size-2 rounded-full bg-white ring-2 ring-gwc-blue"
                      />
                    )}
                  </motion.li>
                ),
              )}
            </motion.ul>
          </div>
        ))}
      </nav>

      {!forceExpanded && (
        <SidebarControl mode={mode} onModeChange={onModeChange} collapsed={collapsed} floating={floating} />
      )}
    </motion.aside>
  );
}

type SidebarControlProps = {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  collapsed: boolean;
  floating: boolean;
};

function SidebarControl({ mode, onModeChange, collapsed, floating }: SidebarControlProps) {
  const hoverAnimated = mode === "expand-on-hover";

  return (
    <footer className="border-t border-white/10 p-2">
      <Tooltip label="Sidebar control" direction="right" gap={10} disabled={!collapsed}>
        <Popover
          label="Sidebar control"
          trigger={
            <>
              <span className="grid size-5 shrink-0 place-items-center opacity-90">
                <LayoutSidebarIcon size={15} />
              </span>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={hoverAnimated ? hoverLabelIn : labelIn}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <span className="min-w-0 flex-1 truncate text-left leading-none">Sidebar</span>
                  <span className="shrink-0 opacity-70">
                    <ChevronRightIcon />
                  </span>
                </motion.span>
              )}
            </>
          }
          triggerClassName={`flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 font-body text-[0.78rem] text-mist-100/95 transition-colors duration-150 hover:bg-gwc-blue-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
            floating ? "justify-start pl-3 pr-2" : collapsed ? "justify-center px-0" : ""
          }`}
          className="w-56 px-1.5"
          scrollable={false}
        >
          {(close) => (
            <div className="flex flex-col gap-0.5 py-1">
              <p className="px-2.5 pb-1.5 pt-1 font-body text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                Sidebar control
              </p>
              {SIDEBAR_MODE_OPTIONS.map((option) => {
                const active = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      onModeChange(option.value);
                      close();
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                      active
                        ? "bg-slate-100 font-semibold text-navy-800 dark:bg-white/10 dark:text-mist-100"
                        : "text-slate-600 hover:bg-slate-100 hover:text-navy-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-mist-100"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`grid size-4 shrink-0 place-items-center rounded-full border ${
                        active ? "border-navy-700 dark:border-mist-100" : "border-slate-300 dark:border-white/25"
                      }`}
                    >
                      {active && <span className="size-2 rounded-full bg-navy-700 dark:bg-mist-100" />}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </Popover>
      </Tooltip>
    </footer>
  );
}
