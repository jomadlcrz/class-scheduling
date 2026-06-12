import { Badge, type BadgeTone } from "../../components/ui/badge";
import type { Role } from "../../types/user";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  registrar: "Registrar",
  dean: "Dean",
  faculty: "Faculty",
  student: "Student",
};

const roleTones: Record<Role, BadgeTone> = {
  admin: "gold",
  registrar: "navy",
  dean: "emerald",
  faculty: "slate",
  student: "sky",
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={roleTones[role]}>{ROLE_LABELS[role]}</Badge>;
}
