import { useState } from "react";
import { ThemeProvider } from "../landing/theme-provider";
import { ThemeToggle } from "../landing/theme-toggle";

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
    <ThemeProvider>
      <ForgotPasswordPage />
    </ThemeProvider>
  );
}

function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
    }, 1500);
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

      {/* Centered layout */}
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-16 sm:px-8">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
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
            <span className="font-sans text-xs tracking-wide text-navy-500 dark:text-navy-300">
              Class Scheduling
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white/90 px-8 py-10 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-navy-800/60">
          {sent ? (
            <SuccessState />
          ) : (
            <>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                  <LockIcon />
                </div>
                <h1 className="font-display text-3xl tracking-wide text-navy-700 dark:text-white">
                  Reset password
                </h1>
                <p className="mt-1.5 font-sans text-sm text-slate-500 dark:text-navy-300">
                  Enter your email and we'll send a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="font-sans text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@gwc.edu.ph"
                    className="w-full rounded-lg border border-slate-300 bg-transparent px-3.5 py-2.5 font-sans text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors duration-150 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 dark:border-white/15 dark:text-white dark:placeholder-slate-500 dark:focus:border-gold-400 dark:focus:ring-gold-400/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-navy-800 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      Sending…
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to log in */}
        <a
          href="/login"
          className="mt-6 flex cursor-pointer items-center gap-1.5 font-sans text-sm text-slate-500 transition-colors duration-150 hover:text-slate-700 focus-visible:outline-none focus-visible:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 dark:focus-visible:text-slate-300"
        >
          <ArrowLeftIcon />
          Back to log in
        </a>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10">
        <CheckIcon />
      </div>
      <h2 className="font-display text-2xl tracking-wide text-navy-700 dark:text-white">
        Check your inbox
      </h2>
      <p className="mt-2 font-sans text-sm leading-relaxed text-slate-500 dark:text-navy-300">
        If that email is registered, a reset link is on its way. Check your spam folder if it doesn't arrive within a few minutes.
      </p>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-500 dark:text-slate-400"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-500"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
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
