import { NavLink } from "react-router";
import { useAuth } from "~/hooks/use-auth";
import type { Role } from "~/types/user";

type StructureTab = { to: string; label: string; roles: Role[] };

// Roles mirror each page's RoleGuard so a tab never links somewhere the user can't open.
const TABS: StructureTab[] = [
  { to: "/departments", label: "Departments", roles: ["admin", "registrar"] },
  { to: "/program-curricula", label: "Program Curricula", roles: ["admin", "registrar", "dean"] },
  { to: "/sets", label: "Sets", roles: ["admin", "registrar", "dean"] },
];

/**
 * Route tabs across the academic-structure trio (Departments · Program Curricula · Sets) —
 * an in-page alternative to the sidebar for switching between the three. Filtered by the
 * viewer's role so it only shows destinations they can actually open.
 */
export function AcademicStructureTabs({ className }: { className?: string }) {
  const { user } = useAuth();
  const tabs = user ? TABS.filter((tab) => tab.roles.includes(user.role)) : [];
  if (tabs.length < 2) return null; // nothing to switch between

  return (
    <nav
      aria-label="Academic structure"
      className={`flex flex-wrap gap-1 border-b border-slate-200 dark:border-white/10 ${className ?? ""}`.trim()}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `-mb-px rounded-t-sm border-b-2 px-4 py-2.5 font-body text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
              isActive
                ? "border-navy-700 text-navy-700 dark:border-gold-400 dark:text-mist-100"
                : "border-transparent text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-mist-100"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
