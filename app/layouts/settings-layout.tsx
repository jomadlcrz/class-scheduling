import { Outlet } from "react-router";
import { SettingsSidebar } from "~/features/settings/settings-sidebar";

/**
 * Desktop gets a dedicated settings sidebar (app-shell hides the main app
 * Sidebar for /settings routes so this doesn't double up). Mobile has no room
 * for a sidebar — each page's SettingsPageHeader renders a "Your account"
 * quick switcher instead, right below the title.
 */
export default function SettingsLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex gap-8">
        <SettingsSidebar />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
