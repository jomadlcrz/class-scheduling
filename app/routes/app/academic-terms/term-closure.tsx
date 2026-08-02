import { RoleGuard } from "~/auth/role-guard";
import { TermClosurePage } from "~/features/academic-terms/term-closure-page";

export function meta() {
  return [
    { title: "Term Closure — GWC Class Scheduling" },
    { name: "description", content: "Close a term after posting grades." },
  ];
}

export default function TermClosureRoute() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <TermClosurePage />
    </RoleGuard>
  );
}
