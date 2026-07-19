import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Drawer } from "~/components/ui/drawer";
import { MenuIcon } from "~/components/ui/icons";
import { visibleGroups } from "~/features/settings/sections";
import { useAuth } from "~/hooks/use-auth";

/**
 * Mobile-only quick switcher between settings sections, opened from a
 * centered "Your account" trigger. Desktop uses SettingsSidebar instead.
 */
export function SettingsMobileNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const groups = visibleGroups(user.role);

  return (
    <div className="mb-4 flex justify-center lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-body text-sm font-medium text-navy-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:text-mist-100 dark:hover:bg-white/8"
      >
        <MenuIcon />
        Your account
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title="Your account">
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-2.5 pb-1.5 font-body text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.sections.map((section) => {
                  const active = location.pathname === section.href;
                  return (
                    <button
                      key={section.href}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate(section.href);
                      }}
                      className={`block w-full rounded-md px-2.5 py-2.5 text-left font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                        active
                          ? "bg-slate-200/70 font-semibold text-navy-700 dark:bg-white/10 dark:text-mist-100"
                          : "text-slate-600 hover:bg-slate-100 hover:text-navy-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-mist-100"
                      }`}
                    >
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
