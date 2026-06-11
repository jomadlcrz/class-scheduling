import { useState } from "react";
import { useSearchParams } from "react-router";
import { AuthHeading, AuthLayout } from "../../auth/auth-layout";
import { PasswordForm } from "../../auth/password-form";
import { ResultState } from "../../components/feedback/result-state";

export function meta() {
  return [
    { title: "Reset Password — GWC Class Scheduling" },
    {
      name: "description",
      content: "Set a new password for your GWC Class Scheduling account.",
    },
  ];
}

export default function ResetPassword() {
  return (
    <AuthLayout backHref="/login" backLabel="Back to log in">
      <ResetPasswordContent />
    </AuthLayout>
  );
}

function ResetPasswordContent() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    // TODO: POST token + new password to the reset endpoint.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setDone(true);
  }

  if (!token) {
    return (
      <ResultState
        tone="error"
        title="Invalid or expired link"
        action={{ href: "/forgot-password", label: "Request a New Link" }}
      >
        This password reset link is missing or no longer valid. Request a new one to continue.
      </ResultState>
    );
  }

  if (done) {
    return (
      <ResultState
        tone="success"
        title="Password updated"
        action={{ href: "/login", label: "Back to Log In" }}
      >
        Your password has been changed. You can now log in with your new password.
      </ResultState>
    );
  }

  return (
    <>
      <AuthHeading title="Set a new password">
        Create a strong password for your account.
      </AuthHeading>
      <PasswordForm submitLabel="Save Password" loadingLabel="Saving…" onSubmit={handleSubmit} />
    </>
  );
}
