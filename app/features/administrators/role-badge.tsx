import { Badge, type BadgeTone } from "~/components/ui/badge";
import type { AdministratorRole } from "~/types/administrator";

const roleTones: Record<AdministratorRole, BadgeTone> = {
  "Super Admin": "gold",
  "Registrar Admin": "navy",
};

export function AdministratorRoleBadge({ role }: { role: AdministratorRole }) {
  return <Badge tone={roleTones[role]}>{role}</Badge>;
}
