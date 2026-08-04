import type { ComponentType } from "react";
import {
  BookIcon,
  Building2Icon,
  CalendarClockIcon,
  CalendarIcon,
  GraduationCapIcon,
  KeyIcon,
  LayersIcon,
  UsersIcon,
  UsersRoundIcon,
} from "~/components/ui/icons";
import type { ArchiveCategoryKey } from "~/services/archive.service";

export type ArchiveTabKey =
  | "buildings"
  | "rooms"
  | "departments"
  | "programs"
  | "sets"
  | "subjects"
  | "students"
  | "school-years"
  | "semesters"
  | "permissions";

export const ARCHIVE_TAB_TO_CATEGORY: Record<ArchiveTabKey, ArchiveCategoryKey> = {
  buildings: "buildings",
  rooms: "rooms",
  departments: "departments",
  programs: "programs",
  sets: "sets",
  subjects: "subjects",
  students: "students",
  "school-years": "school_years",
  semesters: "semesters",
  permissions: "permissions",
};

export type ArchiveTabConfig = {
  key: ArchiveTabKey;
  label: string;
  icon: ComponentType;
  roles: ("admin" | "registrar")[];
};

/** Category order matches the archive index screen mockup and backend ARCHIVE_CATEGORIES. */
export const ARCHIVE_TABS: ArchiveTabConfig[] = [
  { key: "buildings", label: "Buildings", icon: Building2Icon, roles: ["registrar"] },
  { key: "rooms", label: "Rooms", icon: LayersIcon, roles: ["registrar"] },
  { key: "departments", label: "Departments", icon: Building2Icon, roles: ["registrar"] },
  { key: "programs", label: "Programs", icon: GraduationCapIcon, roles: ["registrar"] },
  { key: "sets", label: "Sets", icon: UsersRoundIcon, roles: ["registrar"] },
  { key: "subjects", label: "Subjects", icon: BookIcon, roles: ["registrar"] },
  { key: "students", label: "Students", icon: UsersIcon, roles: ["registrar"] },
  { key: "school-years", label: "School years", icon: CalendarIcon, roles: ["registrar"] },
  { key: "semesters", label: "Semesters", icon: CalendarClockIcon, roles: ["registrar"] },
  { key: "permissions", label: "Permissions", icon: KeyIcon, roles: ["admin"] },
];

export const ARCHIVE_PAGE_SUBTITLE =
  "Browse and restore archived records. Data is preserved until you restore it.";
