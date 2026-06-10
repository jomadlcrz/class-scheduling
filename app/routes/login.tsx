import { useState } from "react";
import { ThemeProvider } from "../landing/theme-provider";
import { ThemeToggle } from "../landing/theme-toggle";

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
      <LoginPage />
    </ThemeProvider>
  );
}

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-cream-50 dark:bg-navy-950">
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="blueprint-grid absolute inset-0 text-navy-900/6 dark:text-white/5" />
        <div
          className="absolute -top-40 left-1/2 size-160 -translate-x-1/2 opacity-20 dark:opacity-[0.12]"
          style={{ background: "radial-gradient(circle, rgb(212 175 55) 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-1/3 -left-32 size-128 opacity-[0.12] dark:opacity-20"
          style={{ background: "radial-gradient(circle, rgb(30 58 110) 0%, transparent 65%)" }}
        />
      </div>

      {/* Theme toggle */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex min-h-dvh">
        {/* ── Left branding panel (desktop only) ── */}
        <div className="relative hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col items-center justify-center overflow-hidden bg-navy-500 dark:bg-navy-900 px-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="blueprint-grid absolute inset-0 text-white/4" />
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
              <img
                src="/images/logos/gwc-logo.avif"
                alt="GWC logo"
                width={80}
                height={80}
                loading="eager"
                className="size-16 object-contain xl:size-20"
              />
              <div className="flex flex-col items-center leading-none">
                <span className="font-display text-5xl tracking-wide text-white xl:text-6xl">
                  GWC
                </span>
                <span className="font-sans text-sm tracking-wide text-gold-300 xl:text-base">
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

        {/* ── Right form panel ── */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
          {/* Mobile-only logo */}
          <div className="mb-10 flex flex-col items-center gap-3 lg:hidden">
            <img
              src="/images/logos/gwc-logo.avif"
              alt="GWC logo"
              width={56}
              height={56}
              loading="eager"
              className="size-14 object-contain"
            />
            <div className="flex flex-col items-center leading-none">
              <span className="font-display text-4xl tracking-wide text-navy-700 dark:text-white">
                GWC
              </span>
              <span className="font-sans text-xs tracking-wide text-navy-500 dark:text-navy-300">
                Class Scheduling
              </span>
            </div>
          </div>

          {/* Form card */}
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white/90 px-8 py-10 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-navy-800/60">
            <h1 className="font-display text-3xl tracking-wide text-navy-700 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-1.5 font-sans text-sm text-slate-500 dark:text-navy-300">
              Log in to your GWC account
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
              {/* Identifier */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="identifier"
                  className="font-sans text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Email
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="you@gwc.edu.ph"
                  className="w-full rounded-lg border border-slate-300 bg-transparent px-3.5 py-2.5 font-sans text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors duration-150 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 dark:border-white/15 dark:text-white dark:placeholder-slate-500 dark:focus:border-gold-400 dark:focus:ring-gold-400/20"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="font-sans text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <a
                    href="/forgot-password"
                    className="font-sans text-xs text-navy-600 transition-colors duration-150 hover:text-gold-600 focus-visible:outline-none focus-visible:text-gold-600 dark:text-navy-300 dark:hover:text-gold-300 dark:focus-visible:text-gold-300"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 bg-transparent py-2.5 pl-3.5 pr-10 font-sans text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors duration-150 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 dark:border-white/15 dark:text-white dark:placeholder-slate-500 dark:focus:border-gold-400 dark:focus:ring-gold-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors duration-150 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-navy-800 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Logging in…
                  </>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

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

          {/* Back to home */}
          <a
            href="/"
            className="mt-6 flex cursor-pointer items-center gap-1.5 font-sans text-sm text-slate-500 transition-colors duration-150 hover:text-slate-700 focus-visible:outline-none focus-visible:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 dark:focus-visible:text-slate-300"
          >
            <ArrowLeftIcon />
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}

/** Decorative mini schedule grid for the left panel. */
function SchedulePreview() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  type Block = { day: number; row: number; label: string; gold: boolean };
  const blocks: Block[] = [
    { day: 0, row: 0, label: "CS 101", gold: true },
    { day: 1, row: 1, label: "MATH 2", gold: false },
    { day: 2, row: 0, label: "ENG 3", gold: true },
    { day: 3, row: 2, label: "PE 1", gold: false },
    { day: 4, row: 1, label: "HIS 4", gold: true },
    { day: 0, row: 2, label: "FIL 1", gold: false },
    { day: 2, row: 2, label: "SCI 2", gold: false },
    { day: 4, row: 0, label: "IT 3", gold: false },
  ];

  return (
    <div className="select-none text-left">
      <div className="mb-2 grid grid-cols-5 gap-1.5">
        {days.map((d) => (
          <div key={d} className="text-center font-sans text-[10px] font-medium text-white/40">
            {d}
          </div>
        ))}
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="mb-1.5 grid grid-cols-5 gap-1.5">
          {days.map((_, col) => {
            const block = blocks.find((b) => b.day === col && b.row === row);
            return (
              <div
                key={col}
                className={`flex h-10 items-center justify-center rounded-md border text-center font-sans text-[9px] font-medium leading-tight ${
                  block
                    ? block.gold
                      ? "border-gold-400/40 bg-gold-400/15 text-gold-300"
                      : "border-navy-300/30 bg-navy-300/10 text-navy-300"
                    : "border-white/5 bg-white/3"
                }`}
              >
                {block?.label}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
