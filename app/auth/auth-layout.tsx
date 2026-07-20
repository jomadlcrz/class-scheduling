import type { ReactNode } from "react";
import { ThemeProvider } from "~/components/theme/theme-provider";
import { ArrowLeftIcon, HelpCircleIcon } from "~/components/ui/icons";

/** Fixed help link shown in the top-right corner of every auth page. */
function HelpLink() {
  return (
    <a
      href="/help"
      aria-label="Help"
      className="fixed right-4 top-4 z-50 grid size-9 cursor-pointer place-items-center rounded-full text-navy-700 transition-colors duration-150 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-200 dark:hover:bg-white/10"
    >
      <HelpCircleIcon />
    </a>
  );
}

/** Fixed radial-gradient backdrop shared by every auth page. */
export function AmbientBackground() {
  return (
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
  );
}

type BrandLogoProps = {
  width?: number;
  className?: string;
};

/** GWC logo linked back to the home page. */
export function BrandLogo({ width = 56, className = "size-14 object-contain" }: BrandLogoProps) {
  return (
    <a
      href="/"
      aria-label="GWC Class Scheduling — back to home"
      className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
    >
      <img
        src="/images/logos/gwc-logo.avif"
        alt="GWC logo"
        width={width}
        height={width}
        loading="eager"
        className={className}
      />
    </a>
  );
}

/** Centered page heading with an optional subtitle, used above auth forms. */
export function AuthHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="font-display text-3xl tracking-wide text-navy-700 dark:text-mist-100">
        {title}
      </h1>
      {children && (
        <p className="mt-1.5 font-body text-sm text-slate-500 dark:text-navy-300">{children}</p>
      )}
    </div>
  );
}

type AuthLayoutProps = {
  /** When set, renders a fixed back button in the top-left corner. */
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
};

/**
 * Centered single-column chrome for auth flows (forgot/reset/change password):
 * theme context, ambient background, optional back link, logo, and a
 * max-w-sm content slot.
 */
export function AuthLayout({ backHref, backLabel = "Back", children }: AuthLayoutProps) {
  return (
    <ThemeProvider>
      <div className="relative min-h-dvh overflow-hidden bg-cream-50 dark:bg-surface">
        <AmbientBackground />

        <HelpLink />

        {backHref && (
          <a
            href={backHref}
            aria-label={backLabel}
            className="fixed left-4 top-4 z-50 grid size-9 cursor-pointer place-items-center rounded-full text-navy-700 transition-colors duration-150 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <ArrowLeftIcon />
          </a>
        )}

        <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-16 sm:px-8">
          <div className="mb-10 flex flex-col items-center gap-3">
            <BrandLogo />
          </div>

          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </ThemeProvider>
  );
}

type AuthSplitLayoutProps = {
  /** Gold subtitle under the school name in the branding panel (e.g. "CLASS SCHEDULING", "ACCOUNT SECURITY"). */
  label: string;
  /** When set, renders a fixed back button in the top-left corner. */
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
};

/**
 * Two-panel chrome for the primary auth flows (login, forgot/reset/change
 * password): navy branding panel (desktop) + centered form panel with a
 * mobile-only branding fallback.
 */
export function AuthSplitLayout({ label, backHref, backLabel = "Back", children }: AuthSplitLayoutProps) {
  return (
    <ThemeProvider>
      <div className="relative min-h-dvh overflow-hidden bg-cream-50 dark:bg-surface">
        <AmbientBackground />

        <HelpLink />

        {backHref && (
          <a
            href={backHref}
            aria-label={backLabel}
            className="fixed left-4 top-4 z-50 grid size-9 cursor-pointer place-items-center rounded-full text-navy-700 transition-colors duration-150 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-200 dark:hover:bg-white/10 lg:text-white lg:hover:bg-white/10 lg:dark:text-mist-100 lg:dark:hover:bg-white/10"
          >
            <ArrowLeftIcon />
          </a>
        )}

        <div className="relative z-10 flex min-h-dvh">
          <AuthBrandingPanel label={label} />

          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
            {/* Mobile-only branding */}
            <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
              <BrandLogo width={64} className="size-16 object-contain" />
              <div className="text-center">
                <p className="font-display text-xl tracking-wide text-navy-800 dark:text-mist-100">
                  GOLDEN WEST COLLEGES, INC.
                </p>
                <p className="font-display text-lg tracking-[1px] text-gold-500 dark:text-gold-400">
                  {label}
                </p>
              </div>
            </div>

            <div className="w-full max-w-sm">{children}</div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

/** Left branding panel, desktop only. */
function AuthBrandingPanel({ label }: { label: string }) {
  return (
    <aside className="relative hidden flex-col items-center justify-center overflow-hidden bg-navy-800 dark:bg-surface-raised px-12 text-white lg:flex lg:w-[45%] xl:w-1/2">
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
        <BrandLogo width={96} className="size-24 object-contain" />

        <div>
          <h1 className="font-display text-[clamp(1.4rem,2vw,2.4rem)] leading-tight tracking-[0.6px]">
            GOLDEN WEST COLLEGES, INC.
          </h1>
          <p
            className="mt-1.5 font-display text-[clamp(1.4rem,2.6vw,2.8rem)] leading-none tracking-[1.2px] text-gold-400"
            style={{ textShadow: "0 3px 0 rgba(0,0,0,0.32)" }}
          >
            {label}
          </p>
        </div>
      </div>
    </aside>
  );
}
