import { Outlet } from "react-router";
import { SettingsSidebar } from "~/features/settings/settings-sidebar";

/**
 * Desktop settings get a full-height rail pinned to the left corner below the
 * navbar, mirroring the main app sidebar (which app-shell hides for /settings
 * routes). Mobile has no room for a rail — each page's SettingsPageHeader
 * renders a "Your account" quick switcher instead, right below the title.
 */
export default function SettingsLayout() {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-12 hidden h-[calc(100dvh-3rem)] w-64 shrink-0 overflow-hidden border-r border-slate-300 bg-white lg:block dark:border-white/10 dark:bg-surface-raised">
        <SettingsSidebar />
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
