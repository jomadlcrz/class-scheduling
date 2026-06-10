import { useState } from "react";
import { ThemeProvider } from "../landing/theme-provider";

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
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-cream-50 dark:bg-navy-950">
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute -top-40 left-1/2 size-160 -translate-x-1/2 opacity-20 dark:opacity-[0.12]"
          style={{ background: "radial-gradient(circle, rgb(212 175 55) 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-1/3 -left-32 size-128 opacity-[0.12] dark:opacity-20"
          style={{ background: "radial-gradient(circle, rgb(30 58 110) 0%, transparent 65%)" }}
        />
      </div>

      <div className="relative z-10 flex min-h-dvh">
        {/* ── Left branding panel (desktop only) ── */}
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
              <a
                href="/"
                aria-label="GWC Class Scheduling — back to home"
                className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
              <img
                src="/images/logos/gwc-logo.avif"
                alt="GWC logo"
                width={80}
                height={80}
                loading="eager"
                className="size-16 object-contain xl:size-20"
              />
              </a>
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

        {/* ── Right form panel ── */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
          {/* Mobile-only logo */}
          <div className="mb-10 flex flex-col items-center gap-3 lg:hidden">
          <a
              href="/"
              aria-label="GWC Class Scheduling — back to home"
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
            <img
              src="/images/logos/gwc-logo.avif"
              alt="GWC logo"
              width={56}
              height={56}
              loading="eager"
              className="size-14 object-contain"
            />
            </a>
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

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
              {/* Error feedback */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 font-sans text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                >
                  {error}
                </div>
              )}

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
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-sans text-base text-slate-900 placeholder-slate-400 outline-none transition-colors duration-150 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500 dark:focus:border-gold-400 dark:focus:ring-gold-400/25"
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
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-4 pr-11 font-sans text-base text-slate-900 placeholder-slate-400 outline-none transition-colors duration-150 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder-slate-500 dark:focus:border-gold-400 dark:focus:ring-gold-400/25"
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

              {/* Remember me */}
              <div className="flex w-fit items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  name="remember"
                  className="size-4 cursor-pointer accent-navy-800 dark:accent-gold-400"
                />
                <span className="font-sans text-sm text-slate-600 dark:text-slate-300">
                  Remember me
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-navy-800 py-3 font-sans text-base font-medium text-white transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
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
