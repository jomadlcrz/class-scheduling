import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { AuthHeading, AuthSplitLayout } from "~/auth/auth-layout";
import { PasswordForm, type PasswordFormValues } from "~/auth/password-form";
import { LoadingState } from "~/components/feedback/loading-state";
import { ResultState } from "~/components/feedback/result-state";
import { authService } from "~/services/auth.service";

export function meta() {
  return [
    { title: "Reset Password — GWC Class Scheduling" },
    {
      name: "description",
      content: "Set a new password for your GWC Class Scheduling account.",
    },
  ];
}

/**
 * Public route reached via the emailed reset link (?token=...). Unlike the
 * authenticated area, access here is gated by the token itself rather than
 * a login session — a session redirect would strip the token and lock the
 * user out. The token is verified against the backend before the form is
 * ever shown.
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"checking" | "valid" | "invalid">("checking");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    authService.verifyResetToken(token).then((valid) => {
      if (!cancelled) setStatus(valid ? "valid" : "invalid");
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "checking") return <LoadingState label="Verifying link…" />;

  return (
    <AuthSplitLayout label="ACCOUNT SECURITY" backHref="/login" backLabel="Back to log in">
      {status === "invalid" ? <InvalidLinkState /> : <ResetPasswordContent token={token as string} />}
    </AuthSplitLayout>
  );
}

function InvalidLinkState() {
  return (
    <ResultState
      tone="error"
      title="Link expired"
      action={{ href: "/forgot-password", label: "Request a New Link" }}
    >
      This password reset link is invalid or has expired. Request a new one to continue.
    </ResultState>
  );
}

function ResetPasswordContent({ token }: { token: string }) {
  const [done, setDone] = useState(false);

  async function handleSubmit({ newPassword }: PasswordFormValues) {
    await authService.resetPassword(token, newPassword);
    setDone(true);
  }

  if (done) {
    return (
      <ResultState
        tone="success"
        title="Password reset"
        action={{ href: "/login", label: "Back to Log In" }}
      >
        Your password has been updated. Use it the next time you log in.
      </ResultState>
    );
  }

  return (
    <>
      <AuthHeading title="Set a new password">Choose a new password for your account.</AuthHeading>
      <PasswordForm submitLabel="Reset Password" loadingLabel="Resetting…" onSubmit={handleSubmit} />
    </>
  );
}
