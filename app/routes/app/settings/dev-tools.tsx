import { RoleGuard } from "~/auth/role-guard";
import { SettingsPageHeader } from "~/features/settings/settings-page-header";
import { DevResetToolsPanel } from "~/components/DevResetToolsPanel";

export function meta() {
  return [
    { title: "Developer Tools — GWC Class Scheduling" },
    { name: "description", content: "Database maintenance and developer reset tools." },
  ];
}

export default function DevToolsRoute() {
  return (
    <RoleGuard allow={["admin"]}>
      <SettingsPageHeader title="Developer Tools" />
      <div className="mt-6">
        <DevResetToolsPanel />
      </div>
    </RoleGuard>
  );
}
