import { AmbientBackground, BrandLogo } from "~/auth/auth-layout";
import { GuestGuard } from "~/auth/guest-guard";
import { LoginForm } from "~/auth/login-form";
import { ThemeProvider } from "~/components/theme/theme-provider";

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
          {/* Mobile-only branding */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <BrandLogo width={64} className="size-16 object-contain" />
            <div className="text-center">
              <p className="font-display text-xl tracking-wide text-navy-800 dark:text-white">
                GOLDEN WEST COLLEGES, INC.
              </p>
              <p className="font-display text-lg tracking-[1px] text-gold-500 dark:text-gold-400">
                CLASS SCHEDULING
              </p>
            </div>
          </div>

          {/* Form — flat, no card */}
          <div className="w-full max-w-sm">
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
          </div>
        </div>
      </div>
    </div>
  );
}

/** Left branding panel, desktop only. */
function BrandingPanel() {
  return (
    <aside className="relative hidden flex-col items-center justify-center overflow-hidden bg-navy-800 dark:bg-navy-900 px-12 text-white lg:flex lg:w-[45%] xl:w-1/2">
      {/* Dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Floating accent circles */}
      <div aria-hidden="true" className="absolute -right-16 -top-16 size-64 rounded-full bg-white/5" />
      <div aria-hidden="true" className="absolute -bottom-12 -left-12 size-48 rounded-full bg-gold-400/10" />

      <div className="relative z-10 flex max-w-xs flex-col items-center gap-6 text-center">
        {/* Logo */}
        <BrandLogo width={96} className="size-24 object-contain" />

        {/* School name + App title */}
        <div>
          <h1 className="font-display text-[clamp(1.4rem,2vw,2.4rem)] leading-tight tracking-[0.6px]">
            GOLDEN WEST COLLEGES, INC.
          </h1>
          <p
            className="mt-1.5 font-display text-[clamp(1.4rem,2.6vw,2.8rem)] leading-none tracking-[1.2px] text-gold-400"
            style={{ textShadow: "0 3px 0 rgba(0,0,0,0.32)" }}
          >
            CLASS SCHEDULING
          </p>
        </div>
      </div>
    </aside>
  );
}
