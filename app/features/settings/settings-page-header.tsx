import { Card } from "~/components/ui/card";
import { SettingsMobileNav } from "~/features/settings/settings-mobile-nav";
import { PageHeader } from "~/layouts/page-header";

type SettingsPageHeaderProps = {
  title: string;
  /** The /settings hub already lets you pick a section via its cards — skip the redundant switcher there. */
  hideMobileNav?: boolean;
};

/**
 * Card-boxed page title + (mobile-only) "Your account" section switcher
 * below it, matching the phcorner account-details header. Breadcrumb stays
 * outside/above this, unboxed, same as the reference.
 */
export function SettingsPageHeader({ title, hideMobileNav }: SettingsPageHeaderProps) {
  return (
    <>
      <Card className="px-5 py-4">
        <PageHeader title={title} />
      </Card>
      {!hideMobileNav && (
        <div className="mt-4">
          <SettingsMobileNav />
        </div>
      )}
    </>
  );
}
