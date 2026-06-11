import { useState } from "react";
import { useSearchParams } from "react-router";
import { AuthHeading, AuthLayout } from "../../auth/auth-layout";
import { PasswordForm } from "../../auth/password-form";
import { ResultState } from "../../components/feedback/result-state";

export function meta() {
  return [
    { title: "Change Password — GWC Class Scheduling" },
    {
      name: "description",
      content: "Change your GWC Class Scheduling account password.",
    },
  ];
}

export default function ChangePassword() {
  const [searchParams] = useSearchParams();
  // Forced first-login / admin-reset flow: user must set a new password
  // before continuing, so the back link is hidden.
  const isForced = searchParams.get("force") === "true";

  return (
    <AuthLayout backHref={isForced ? undefined : "/"}>
      <ChangePasswordContent isForced={isForced} />
    </AuthLayout>
  );
}

function ChangePasswordContent({ isForced }: { isForced: boolean }) {
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    // TODO: POST current + new password to the change-password endpoint.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setDone(true);
  }

  if (done) {
    return (
      <ResultState
        tone="success"
        title="Password changed"
        action={{ href: "/", label: "Continue" }}
      >
        Your password has been updated. Use it the next time you log in.
      </ResultState>
    );
  }

  return (
    <>
      <AuthHeading title="Change your password">
        {isForced
          ? "For security reasons, you must create a new password before continuing."
          : "Enter your current password and choose a new one."}
      </AuthHeading>
      <PasswordForm
        requireCurrentPassword
        submitLabel="Update Password"
        loadingLabel="Updating…"
        onSubmit={handleSubmit}
      />
    </>
  );
}
