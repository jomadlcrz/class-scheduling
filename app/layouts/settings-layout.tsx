import { Outlet } from "react-router";

/**
 * Settings pages navigate via /settings' anchor-card hub and per-page
 * breadcrumbs instead of a persistent nav — this layout is just chrome.
 */
export default function SettingsLayout() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Outlet />
    </div>
  );
}
