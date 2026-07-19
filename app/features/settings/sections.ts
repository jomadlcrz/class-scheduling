import type { ComponentType } from "react";
import { BellIcon, KeyIcon, TrashIcon, UserIcon } from "~/components/ui/icons";
import type { Role } from "~/types/user";

export type SettingsSection = {
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
export const SETTINGS_GROUPS: SettingsGroup[] = [
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
    label: "Preferences",
    sections: [
      {
        label: "Notifications",
        description: "Choose which in-app notifications you receive.",
        href: "/settings/notifications",
        icon: BellIcon,
      },
    ],
  },
  {
    label: "Administration",
    sections: [
      {
        label: "Recently Deleted",
        description: "Restore items deleted within the last 30 days.",
        href: "/settings/recently-deleted",
        icon: TrashIcon,
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
