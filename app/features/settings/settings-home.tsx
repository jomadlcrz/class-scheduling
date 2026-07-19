import { Link } from "react-router";
import { ChevronRightIcon } from "~/components/ui/icons";
import { visibleGroups } from "~/features/settings/sections";
import { useAuth } from "~/hooks/use-auth";
import { PageHeader } from "~/layouts/page-header";

export function SettingsHome() {
  const { user } = useAuth();

  if (!user) return null;

  const groups = visibleGroups(user.role);

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account, preferences, and system options." />

      <div className="mt-6 flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.label} className="flex flex-col gap-3">
            <h2 className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {group.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.sections.map((section) => (
                <Link
                  key={section.href}
                  to={section.href}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors duration-150 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-navy-700/8 text-navy-700 transition-colors duration-150 group-hover:bg-navy-800 group-hover:text-gold-300 dark:bg-white/10 dark:text-mist-100 dark:group-hover:bg-gold-400 dark:group-hover:text-navy-900">
                    <section.icon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                      {section.label}
                    </span>
                    <span className="mt-0.5 block truncate font-body text-xs text-slate-500 dark:text-slate-400">
                      {section.description}
                    </span>
                  </span>
                  <span className="shrink-0 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-slate-600">
                    <ChevronRightIcon />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
