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
        <h1 className="hidden font-display text-3xl tracking-wide text-navy-700 dark:text-white lg:block">
          Log in to your GWC account
        </h1>

        <LoginForm />

        {/* Legal consent */}
        <p className="mt-5 text-center font-body text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          By logging in, you agree to our{" "}
          <a
            href="/terms-of-use"
            className="font-semibold hover:underline hover:underline-offset-2 focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-2"
          >
            Terms of Use
          </a>{" "}
          and{" "}
          <a
            href="/privacy-policy"
            className="font-semibold hover:underline hover:underline-offset-2 focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-2"
          >
            Privacy Policy
          </a>
          .
        </p>
      </AuthSplitLayout>
    </GuestGuard>
  );
}
