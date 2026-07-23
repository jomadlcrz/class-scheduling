import { AnimatePresence, motion } from "motion/react";
import { type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import {
  AuditLogIcon,
  BlocksIcon,
  BookmarkIcon,
  BookOpenIcon,
  Building2Icon,
  CalendarCheckIcon,
  CalendarClockIcon,
  CalendarIcon,
  CalendarShuffleIcon,
  ClockIcon,
  DashboardIcon,
  DoorOpenIcon,
  FolderOpenIcon,
  GraduationHatIcon,
  LayersIcon,
  MapIcon,
  ShieldIcon,
  ShieldUserIcon,
  TableIcon,
  UserIcon,
  UsersIcon,
  UsersRoundIcon,
} from "~/components/ui/icons";
import { Tooltip } from "~/components/ui/tooltip";
import { useAuth } from "~/hooks/use-auth";
import type { Role } from "~/types/user";

const ALL_ROLES: Role[] = ["admin", "registrar", "dean", "faculty", "student"];

type NavItem = { label: string; to: string; icon: ReactNode; roles: Role[]; matchPrefix?: boolean; matchPaths?: string[] };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: <DashboardIcon />, roles: ALL_ROLES }],
  },
  {
    label: "Scheduling",
    items: [
      { label: "Academic Year", to: "/academic-year", icon: <CalendarIcon />, roles: ["registrar"] },
      { label: "Classroom Mapping", to: "/classroom-mapping", icon: <MapIcon />, roles: ["dean", "registrar"] },
      { label: "Weekly Hour Allocations", to: "/schedules/weekly-hour-allocations", icon: <CalendarClockIcon />, roles: ["registrar"] },
      { label: "Regular Class", to: "/schedules/regular-class", icon: <CalendarCheckIcon />, roles: ["registrar"], matchPaths: ["/schedules/regular-class", "/schedules/new"] },
      { label: "Irregular Class", to: "/schedules/irregular-class", icon: <CalendarShuffleIcon />, roles: ["registrar"] },
      { label: "My Schedule", to: "/faculty-schedule", icon: <CalendarIcon />, roles: ["faculty"] },
      { label: "My Schedule", to: "/student-schedule", icon: <CalendarIcon />, roles: ["student"] },
    ],
  },
  {
    label: "Curriculum & Facilities",
    items: [
      { label: "Buildings", to: "/buildings", icon: <Building2Icon />, roles: ["registrar"] },
      { label: "Rooms", to: "/rooms", icon: <DoorOpenIcon />, roles: ["registrar"] },
      { label: "Departments", to: "/departments", icon: <FolderOpenIcon />, roles: ["registrar"] },
      { label: "Programs", to: "/programs", icon: <BookmarkIcon />, roles: ["registrar"] },
      { label: "Curriculum", to: "/curriculum", icon: <BookOpenIcon />, roles: ["registrar"] },
      { label: "Subjects", to: "/subjects", icon: <GraduationHatIcon />, roles: ["registrar"], matchPrefix: true },
      { label: "Sets", to: "/sets", icon: <LayersIcon />, roles: ["registrar"] },
    ],
  },
  {
    label: "Academic Community",
    items: [
      { label: "Administrators", to: "/administrators", icon: <ShieldUserIcon />, roles: ["admin"] },
      { label: "Faculty", to: "/faculty", icon: <UserIcon />, roles: ["admin"] },
      { label: "Students", to: "/students", icon: <UsersIcon />, roles: ["admin", "registrar"] },
    ],
  },
  {
    label: "My Department",
    items: [
      { label: "Faculty Loads", to: "/faculty-loads", icon: <UsersIcon />, roles: ["dean"] },
      { label: "Department Subjects", to: "/dean/subjects", icon: <BookOpenIcon />, roles: ["dean"] },
      { label: "Department Instructors", to: "/dean/instructors", icon: <UsersRoundIcon />, roles: ["dean"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Roles & Permissions", to: "/permissions", icon: <ShieldIcon />, roles: ["admin"] },
      { label: "Audit Log", to: "/audit", icon: <AuditLogIcon />, roles: ["admin"] },
    ],
  },
];

const itemClassName = (isActive: boolean) =>
  `group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left font-body text-[0.82rem] text-white/95 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
    isActive ? "bg-gwc-blue-bright font-extrabold" : "hover:bg-gwc-blue-bright"
  }`;

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

type SidebarProps = {
  collapsed: boolean;
  onExpand: () => void;
  onNavigate: () => void;
};

export function Sidebar({ collapsed, onExpand, onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const hasRole = (roles: Role[]) => roles.includes(user.role);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasRole(item.roles)),
  })).filter((group) => group.items.length > 0);

  return (
    <motion.aside
      aria-label="Portal navigation"
      animate={{ width: collapsed ? 68 : 256 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex h-dvh flex-col overflow-hidden border-r border-white/10 bg-linear-to-b from-gwc-blue to-gwc-blue-deep text-white"
    >
      <header
        className={`flex items-center gap-2.5 px-4 pb-3 pt-4 ${collapsed ? "justify-center px-0" : ""}`}
      >
        <img
          src="/images/logos/gwc-logo.avif"
          alt="GWC logo"
          className="size-9 shrink-0 object-contain"
        />
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="brand-text"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="min-w-0 overflow-hidden font-body leading-[1.05]"
            >
              <span className="block truncate text-[1rem] font-black">GWC</span>
              <span className="mt-0.5 block truncate border-t-2 border-white/20 pt-0.5 text-[1rem] font-black">
                Class Scheduling
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <nav
        aria-label="Sidebar navigation"
        className={`flex-1 overflow-y-auto pb-4 scrollbar-none ${collapsed ? "px-1.5" : "px-3"}`}
      >
        {groups.map((group) => (
          <div key={group.label || "_"} className="mt-3 first:mt-1">
            <AnimatePresence mode="wait">
              {!collapsed && group.label && (
                <motion.p
                  key="group-label"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="px-2 pb-0.5 pt-1 font-body text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-gwc-blue-soft"
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
              {group.items.map((item) => (
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
                        className={({ isActive }) => {
                          const active = item.matchPaths
                            ? item.matchPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"))
                            : isActive;
                          return `${itemClassName(active)} ${collapsed ? "justify-center px-0" : ""} ${
                            active && !collapsed
                              ? "before:absolute before:-left-1.5 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded before:bg-white"
                              : ""
                          }`;
                        }}
                      >
                        <span className="grid size-5 shrink-0 place-items-center opacity-90">
                          {item.icon}
                        </span>
                        {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                      </NavLink>
                    </Tooltip>
                  </motion.li>
                ),
              )}
            </motion.ul>
          </div>
        ))}
      </nav>
    </motion.aside>
  );
}
