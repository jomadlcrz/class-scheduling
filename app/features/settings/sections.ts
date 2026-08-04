import type { ComponentType } from "react";
import { ArchiveIcon, KeyIcon, UserIcon } from "~/components/ui/icons";
import type { Role } from "~/types/user";

type SettingsSection = {
  label: string;
  description: string;
  href: string;
  icon: ComponentType;
  /** Omitted = visible to every role. */
  roles?: Role[];
};

export type SettingsGroup = {
  label: string;
  sections: SettingsSection[];
};

/** Single source for settings navigation — the hub cards and the mobile quick-switcher both render from this. */
const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    label: "Account",
    sections: [
      {
        label: "Profile",
        description: "Your account details and profile picture.",
        href: "/settings/profile",
        icon: UserIcon,
      },
      {
        label: "Account & Security",
        description: "Change the password you use to sign in.",
        href: "/settings/security",
        icon: KeyIcon,
      },
    ],
  },
  {
    label: "Administration",
    sections: [
      {
        label: "Archive",
        description: "Browse and restore archived records. Data is preserved until you restore it.",
        href: "/settings/archive",
        icon: ArchiveIcon,
        roles: ["admin", "registrar"],
      },
    ],
  },
];

export function visibleGroups(role: Role | undefined): SettingsGroup[] {
  return SETTINGS_GROUPS.map((group) => ({
    ...group,
    sections: group.sections.filter((s) => !s.roles || (role && s.roles.includes(role))),
  })).filter((group) => group.sections.length > 0);
}
