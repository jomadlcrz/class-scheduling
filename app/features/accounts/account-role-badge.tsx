import { Badge, type BadgeTone } from "~/components/ui/badge";

/** Display tones for backend RoleName values ("Super Admin", "Registrar Admin",
 * "Dean", "Instructor", "Student") — shared by office-staff rows and the
 * all-accounts table. Unknown values fall back to slate. */
const roleTones: Record<string, BadgeTone> = {
  "Super Admin": "gold",
  "Registrar Admin": "navy",
  Dean: "violet",
  Instructor: "sky",
  Student: "emerald",
};

export function AccountRoleBadge({ role }: { role: string }) {
  return <Badge tone={roleTones[role] ?? "slate"}>{role}</Badge>;
}
