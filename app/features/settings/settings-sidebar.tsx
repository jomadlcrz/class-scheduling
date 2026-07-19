import { NavLink } from "react-router";
import { visibleGroups } from "~/features/settings/sections";
import { useAuth } from "~/hooks/use-auth";

/** Desktop-only settings navigation rail. Mobile uses SettingsMobileNav instead. */
export function SettingsSidebar() {
  const { user } = useAuth();

  if (!user) return null;

  const groups = visibleGroups(user.role);

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav aria-label="Settings navigation" className="sticky top-8 flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2.5 pb-1.5 font-body text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.sections.map((section) => (
                <li key={section.href}>
                  <NavLink
                    to={section.href}
                    className={({ isActive }) =>
                      `block rounded-md px-2.5 py-2 font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                        isActive
                          ? "bg-slate-200/70 font-semibold text-navy-700 dark:bg-white/10 dark:text-mist-100"
                          : "text-slate-600 hover:bg-slate-100 hover:text-navy-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-mist-100"
                      }`
                    }
                  >
                    {section.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
