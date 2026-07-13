import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { AuthHeading, AuthSplitLayout } from "~/auth/auth-layout";
import { PasswordForm, type PasswordFormValues } from "~/auth/password-form";
import { LoadingState } from "~/components/feedback/loading-state";
import { ResultState } from "~/components/feedback/result-state";
import { getPending } from "~/lib/session";
import { authService } from "~/services/auth.service";

export function meta() {
  return [
    { title: "Change Password — GWC Class Scheduling" },
    {
      name: "description",
      content: "Change your GWC Class Scheduling account password.",
    },
  ];
}

/**
 * Forced first-login flow only: reachable while a temp-password login is
 * pending, otherwise redirects to /login. Logged-in users change their
 * password in Settings → Security.
 */
export default function ChangePassword() {
  // Pending state lives in browser storage, so it resolves after hydration.
  // Checked once: changing the password clears the pending state, and the
  // success screen must survive that.
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    setStatus(getPending() ? "allowed" : "denied");
  }, []);

  if (status === "checking") return <LoadingState />;
  if (status === "denied") return <Navigate to="/login" replace />;

  return (
    <AuthSplitLayout label="ACCOUNT SECURITY">
      <ChangePasswordContent />
    </AuthSplitLayout>
  );
}

function ChangePasswordContent() {
  const [done, setDone] = useState(false);

  async function handleSubmit({ newPassword }: PasswordFormValues) {
    await authService.changePassword(newPassword);
    setDone(true);
  }

  if (done) {
    return (
      <ResultState
        tone="success"
        title="Password changed"
        action={{ href: "/dashboard", label: "Continue" }}
      >
        Your password has been updated. Use it the next time you log in.
      </ResultState>
    );
  }

  return (
    <>
      <AuthHeading title="Change your password">
        For security reasons, you must create a new password before continuing.
      </AuthHeading>
      {/* The fresh temp-password login already proved the current password. */}
      <PasswordForm
        submitLabel="Update Password"
        loadingLabel="Updating…"
        onSubmit={handleSubmit}
      />
    </>
  );
}
