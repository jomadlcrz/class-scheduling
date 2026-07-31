import { Card } from "~/components/ui/card";
import { SettingsMobileNav } from "~/features/settings/settings-mobile-nav";
import { PageHeader } from "~/layouts/page-header";

type SettingsPageHeaderProps = {
  title: string;
};

/**
 * Card-boxed page title + (mobile-only) "Your account" section switcher
 * below it, matching the phcorner account-details header.
 */
export function SettingsPageHeader({ title }: SettingsPageHeaderProps) {
  return (
    <>
      <Card className="px-5 py-4">
        <PageHeader title={title} />
      </Card>
      <div className="mt-4">
        <SettingsMobileNav />
      </div>
    </>
  );
}
