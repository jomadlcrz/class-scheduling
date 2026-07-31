import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router";
import { visibleGroups } from "~/features/settings/sections";
import { useAuth } from "~/hooks/use-auth";
import { profilePhotoService } from "~/services/profile-photo.service";

const itemClassName = (isActive: boolean) =>
  `group relative flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
    isActive
      ? "bg-slate-200/70 font-semibold text-navy-700 before:absolute before:-left-1.5 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-gold-500 dark:bg-white/10 dark:text-mist-100"
      : "text-slate-600 hover:bg-slate-100 hover:text-navy-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-mist-100"
  }`;

/** Full-height settings rail pinned to the left corner on desktop (GitHub/
 * Facebook style). Mobile uses SettingsMobileNav instead. */
export function SettingsSidebar() {
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const fetchPhoto = useCallback(async () => {
    if (!user) return;
    try {
      const data = await profilePhotoService.getPhoto(user.role);
      setPhotoUrl(data.profilePhotoUrl);
    } catch {
      // Photo may not exist yet.
    }
  }, [user]);

  useEffect(() => {
    fetchPhoto();
    function handlePhotoChanged() {
      fetchPhoto();
    }
    window.addEventListener("profile-photo-changed", handlePhotoChanged);
    return () => window.removeEventListener("profile-photo-changed", handlePhotoChanged);
  }, [fetchPhoto]);

  if (!user) return null;

  const groups = visibleGroups(user.role);

  return (
    <nav aria-label="Settings navigation" className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-5 pb-4 pt-5 dark:border-white/10">
        <p className="font-body text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          Your account
        </p>
        <div className="mt-3 flex items-center gap-3">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              aria-hidden="true"
              className="size-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy-800 font-body text-sm font-medium text-white dark:bg-white dark:text-navy-900">
              {(user.firstName[0] ?? "").toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-body text-sm font-semibold text-slate-800 dark:text-mist-100">
              {user.name}
            </p>
            <p className="truncate font-body text-xs text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {groups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="px-2.5 pb-1.5 font-body text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.sections.map((section) => {
                const Icon = section.icon;
                return (
                  <li key={section.href}>
                    <NavLink to={section.href} className={({ isActive }) => itemClassName(isActive)}>
                      <span className="grid size-4 shrink-0 place-items-center opacity-90">
                        <Icon />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{section.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
