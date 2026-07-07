import type { ReactNode } from "react";
import { ThemeProvider } from "~/components/theme/theme-provider";
import { ArrowLeftIcon } from "~/components/ui/icons";

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
      <h1 className="font-display text-3xl tracking-wide text-navy-700 dark:text-white">
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
      <div className="relative min-h-dvh overflow-hidden bg-cream-50 dark:bg-navy-950">
        <AmbientBackground />

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
