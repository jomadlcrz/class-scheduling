import { AuthSplitLayout } from "~/auth/auth-layout";
import { GuestGuard } from "~/auth/guest-guard";
import { LoginForm } from "~/auth/login-form";

export function meta() {
  return [
    { title: "Log In — GWC Class Scheduling" },
    {
      name: "description",
      content: "Sign in to GWC Class Scheduling to manage your class timetables.",
    },
  ];
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
