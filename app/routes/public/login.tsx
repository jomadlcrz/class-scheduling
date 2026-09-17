import { AuthSplitLayout } from "~/auth/auth-layout";
import { GuestGuard } from "~/auth/guest-guard";
import { LoginForm } from "~/auth/login-form";
import { createSeoMeta } from "~/lib/seo";

export function meta() {
  return createSeoMeta({
    title: "Log In",
    path: "/login",
    description:
      "Log in to GWC Class Scheduling to access and manage student schedules, faculty loading, and academic timetables.",
  });
}

export default function Login() {
  return (
    <GuestGuard>
      <AuthSplitLayout label="CLASS SCHEDULING">
        <h1 className="hidden font-display text-3xl tracking-wide text-navy-700 dark:text-mist-100 lg:block">
          Log in to your GWC account
        </h1>

        <LoginForm />
      </AuthSplitLayout>
    </GuestGuard>
  );
}
