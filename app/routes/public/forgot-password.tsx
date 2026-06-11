import { useState } from "react";
import { AuthHeading, AuthLayout } from "../../auth/auth-layout";
import { ForgotPasswordForm } from "../../auth/forgot-password-form";
import { ResultState } from "../../components/feedback/result-state";

export function meta() {
  return [
    { title: "Forgot Password — GWC Class Scheduling" },
    {
      name: "description",
      content: "Reset your GWC Class Scheduling account password.",
    },
  ];
}

export default function ForgotPassword() {
  return (
    <AuthLayout backHref="/login" backLabel="Back to log in">
      <ForgotPasswordContent />
    </AuthLayout>
  );
}

function ForgotPasswordContent() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <ResultState tone="success" title="Check your inbox">
        If that email is registered, a reset link is on its way. Check your spam folder if it
        doesn't arrive within a few minutes.
      </ResultState>
    );
  }

  return (
    <>
      <AuthHeading title="Reset password">
        Enter your email and we'll send a reset link.
      </AuthHeading>
      <ForgotPasswordForm onSent={() => setSent(true)} />
    </>
  );
}
