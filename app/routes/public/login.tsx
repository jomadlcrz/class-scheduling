import { AmbientBackground, BrandLogo } from "../../auth/auth-layout";
import { GuestGuard } from "../../auth/guest-guard";
import { LoginForm } from "../../auth/login-form";
import { SchedulePreview } from "../../auth/schedule-preview";
import { ThemeProvider } from "../../components/theme/theme-provider";

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
    <ThemeProvider>
      <GuestGuard>
        <LoginPage />
      </GuestGuard>
    </ThemeProvider>
  );
}

function LoginPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-cream-50 dark:bg-navy-950">
      <AmbientBackground />

      <div className="relative z-10 flex min-h-dvh">
        <BrandingPanel />

        {/* ── Right form panel ── */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
          {/* Mobile-only logo */}
          <div className="mb-10 flex flex-col items-center gap-3 lg:hidden">
            <BrandLogo />
            <div className="flex flex-col items-center leading-none">
              <span className="font-display text-4xl tracking-wide text-navy-700 dark:text-white">
                GWC
              </span>
              <span className="-mt-2 font-sans text-xs tracking-wide text-navy-500 dark:text-navy-300">
                Class Scheduling
              </span>
            </div>
          </div>

          {/* Form — flat, no card */}
          <div className="w-full max-w-sm">
            <h1 className="hidden font-display text-3xl tracking-wide text-navy-700 dark:text-white lg:block">
              Log in to your GWC account
            </h1>

            <LoginForm />

            {/* Legal consent */}
            <p className="mt-5 text-center font-sans text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              By logging in, you agree to our{" "}
              <a
                href="/terms-of-use"
                className="underline underline-offset-2 transition-colors duration-150 hover:text-navy-600 focus-visible:outline-none focus-visible:text-navy-600 dark:hover:text-slate-300 dark:focus-visible:text-slate-300"
              >
                Terms of Use
              </a>{" "}
              and{" "}
              <a
                href="/privacy-policy"
                className="underline underline-offset-2 transition-colors duration-150 hover:text-navy-600 focus-visible:outline-none focus-visible:text-navy-600 dark:hover:text-slate-300 dark:focus-visible:text-slate-300"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Left branding panel, desktop only. */
function BrandingPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col items-center justify-center overflow-hidden bg-navy-500 dark:bg-navy-900 px-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 -left-32 size-128 opacity-[0.08]"
          style={{ background: "radial-gradient(circle, rgb(212 175 55) 0%, transparent 65%)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 size-128 opacity-[0.08]"
          style={{ background: "radial-gradient(circle, rgb(30 58 110) 0%, transparent 65%)" }}
        />
      </div>

      <div className="relative max-w-md text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <BrandLogo width={80} className="size-16 object-contain xl:size-20" />
          <div className="flex flex-col items-center leading-none">
            <span className="font-display text-5xl tracking-wide text-white xl:text-6xl">
              GWC
            </span>
            <span className="-mt-2 font-sans text-sm tracking-wide text-gold-300 xl:text-base">
              Class Scheduling
            </span>
          </div>
        </div>

        <p className="mt-8 font-sans text-base leading-relaxed text-navy-300 xl:text-lg">
          Build conflict-free academic timetables in minutes.
        </p>

        {/* Decorative schedule grid */}
        <div className="mt-10 rounded-xl border border-white/10 bg-white/4 p-5">
          <SchedulePreview />
        </div>
      </div>
    </div>
  );
}
