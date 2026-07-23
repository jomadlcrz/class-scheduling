import { motion } from "motion/react";
import { ThemeToggle } from "~/components/theme/theme-toggle";

interface NavLink {
  label: string;
  href: string;
}

interface MobileMenuProps {
  links: readonly NavLink[];
  onClose: () => void;
}

/** Full-screen mobile navigation drawer — scrollable content, floating X. */
export function MobileMenu({ links, onClose }: MobileMenuProps) {
  return (
    <>
      {/* X close — same size/position as the hamburger button it replaces */}
      <motion.button
        key="mobile-menu-close"
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed right-4 top-3.5 z-50 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-navy-700 transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-200 dark:hover:bg-white/5"
      >
        <CloseIcon size={16} />
      </motion.button>

      {/* Scrollable full-screen overlay */}
      <motion.div
        key="mobile-menu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-40 overflow-y-auto scrollbar-hide bg-cream-50 dark:bg-surface"
      >
        <div className="min-h-full pb-16">
          {/* Brand lockup — same position as the header, no shift on open */}
          <div className="flex h-16 items-center px-4 sm:px-6">
            <BrandLockup whiteOnDark />
          </div>

          <div className="px-5">
            {/* Log In — primary full-width */}
            <a
              href="/login"
              onClick={onClose}
              className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-lg bg-navy-800 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
            >
              Log In
            </a>

            {/* Nav links — large Vercel-style */}
            <nav className="mt-6 flex flex-col border-t border-slate-200 dark:border-white/10">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="flex cursor-pointer items-center justify-between border-b border-slate-200 py-4 text-base font-medium text-slate-900 transition-colors duration-200 hover:text-gold-600 dark:border-white/10 dark:text-mist-100 dark:hover:text-gold-300"
                >
                  {link.label}
                  <ChevronRightIcon size={16} />
                </a>
              ))}
            </nav>

            {/* Theme row */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-white/10">
              <span className="text-base font-body font-medium text-slate-500 dark:text-slate-400">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/** Logo + name lockup — left-aligned. White logo in dark mode only when requested. */
function BrandLockup({ whiteOnDark = false }: { whiteOnDark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <a
        href="/"
        aria-label="GWC Class Scheduling — home"
        className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      >
        <img
          src="/images/logos/gwc-logo.avif"
          alt="GWC logo"
          width={36}
          height={36}
          loading="eager"
          className={`size-8 object-contain sm:size-9 ${whiteOnDark ? "dark:hidden" : ""}`}
        />
        {whiteOnDark && (
          <img
            src="/images/logos/gwc-logo-white.avif"
            alt="GWC logo"
            width={36}
            height={36}
            loading="eager"
            className="hidden size-8 object-contain dark:block sm:size-9"
          />
        )}
      </a>
      <span className="flex flex-col items-center text-center leading-none">
        <span className="font-display text-2xl tracking-wide text-navy-700 dark:text-mist-100 sm:text-[1.7rem]">
          GWC
        </span>
        <span className="-mt-2 font-body text-[0.65rem] tracking-wide text-navy-500 dark:text-navy-300 sm:text-xs">
          Class Scheduling
        </span>
      </span>
    </div>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
