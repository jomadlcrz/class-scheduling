import { useState } from "react";
import { useSearchParams } from "react-router";
import { ThemeProvider } from "../landing/theme-provider";
import { PasswordForm } from "../auth/password-form";

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
  return (
    <ThemeProvider>
      <ChangePasswordPage />
    </ThemeProvider>
  );
}

function ChangePasswordPage() {
  const [searchParams] = useSearchParams();
  // Forced first-login / admin-reset flow: user must set a new password
  // before continuing, so the back link is hidden.
  const isForced = searchParams.get("force") === "true";
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    // TODO: POST current + new password to the change-password endpoint.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setDone(true);
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

      {/* Back — hidden in forced flow since the change is mandatory */}
      {!isForced && (
        <a
          href="/"
          aria-label="Back"
          className="fixed left-4 top-4 z-50 grid size-9 cursor-pointer place-items-center rounded-full text-navy-700 transition-colors duration-150 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-200 dark:hover:bg-white/10"
        >
          <ArrowLeftIcon />
        </a>
      )}

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
        </div>

        {/* Form — flat, no card */}
        <div className="w-full max-w-sm">
          {done ? (
            <SuccessState />
          ) : (
            <>
              <div className="flex flex-col items-center text-center">
                <h1 className="font-display text-3xl tracking-wide text-navy-700 dark:text-white">
                  Change your password
                </h1>
                <p className="mt-1.5 font-sans text-sm text-slate-500 dark:text-navy-300">
                  {isForced
                    ? "For security reasons, you must create a new password before continuing."
                    : "Enter your current password and choose a new one."}
                </p>
              </div>

              <PasswordForm
                requireCurrentPassword
                submitLabel="Update Password"
                loadingLabel="Updating…"
                onSubmit={handleSubmit}
              />
            </>
          )}
        </div>
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
        Password changed
      </h2>
      <p className="mt-2 font-sans text-sm leading-relaxed text-slate-500 dark:text-navy-300">
        Your password has been updated. Use it the next time you log in.
      </p>
      <a
        href="/"
        className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-lg bg-navy-800 py-3 font-sans text-base font-medium text-white transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
      >
        Continue
      </a>
    </div>
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
      width="20"
      height="20"
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
