import { AuthLayout } from "~/auth/auth-layout";
import { ResultState } from "~/components/feedback/result-state";

export function meta() {
  return [
    { title: "Reset Password — GWC Class Scheduling" },
    {
      name: "description",
      content: "Set a new password for your GWC Class Scheduling account.",
    },
  ];
}

// The backend has no self-service reset endpoint — admins reset passwords.
export default function ResetPassword() {
  return (
    <AuthLayout backHref="/login" backLabel="Back to log in">
      <ResultState
        tone="error"
        title="Password reset unavailable"
        action={{ href: "/login", label: "Back to Log In" }}
      >
        Online password reset isn't available. Please contact your administrator to have your
        password reset.
      </ResultState>
    </AuthLayout>
  );
}
