import { AuthLayout } from "../auth/auth-layout";
import { ResultState } from "../components/feedback/result-state";

export function meta() {
  return [
    { title: "Unauthorized — GWC Class Scheduling" },
    {
      name: "description",
      content: "You don't have permission to access this page.",
    },
  ];
}

export default function Unauthorized() {
  return (
    <AuthLayout>
      <ResultState
        tone="error"
        title="Access denied"
        action={{ href: "/", label: "Back to Home" }}
      >
        You don't have permission to view this page. Contact your administrator if you believe
        this is a mistake.
      </ResultState>
    </AuthLayout>
  );
}
