import { TabLinks } from "~/components/ui/underline-tabs";
import { useAuth } from "~/hooks/use-auth";
import type { Role } from "~/types/user";

type StructureTab = { to: string; label: string; roles: Role[] };

// Roles mirror each page's RoleGuard so a tab never links somewhere the user can't open.
const TABS: StructureTab[] = [
  { to: "/facilities", label: "Facilities", roles: ["admin", "registrar"] },
  { to: "/departments", label: "Departments", roles: ["registrar"] },
  { to: "/program-curricula", label: "Program Curricula", roles: ["registrar"] },
  { to: "/sets", label: "Sets", roles: ["registrar"] },
];

/**
 * Route tabs across the academic-structure group (Departments · Program Curricula · Sets ·
 * Facilities) — an in-page alternative to the sidebar for switching between them. Filtered by
 * the viewer's role so it only shows destinations they can actually open.
 */
export function AcademicStructureTabs({ className }: { className?: string }) {
  const { user } = useAuth();
  const tabs = user ? TABS.filter((tab) => tab.roles.includes(user.role)) : [];
  if (tabs.length < 2) return null; // nothing to switch between

  return (
    <TabLinks
      ariaLabel="Academic structure"
      className={className}
      tabs={tabs.map(({ to, label }) => ({ to, label }))}
    />
  );
}
