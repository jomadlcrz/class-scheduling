import { PageHeader } from "~/layouts/page-header";
import { SettingsMobileNav } from "~/features/settings/settings-mobile-nav";

type SettingsPageHeaderProps = {
  title: string;
};

/**
 * Page title (card-boxed by PageHeader) + (mobile-only) "Your account" section
 * switcher below it, matching the phcorner account-details header.
 */
export function SettingsPageHeader({ title }: SettingsPageHeaderProps) {
  return (
    <>
      <PageHeader title={title} />
      <div className="mt-4">
        <SettingsMobileNav />
      </div>
    </>
  );
}
