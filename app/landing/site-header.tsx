import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ThemeToggle } from "./theme-toggle";
import { AskAiPanel } from "./ask-ai";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { label: "Features", href: "/#features" },
  { label: "Colleges", href: "/#colleges" },
];

/** Sticky navbar: brand on the left, nav centered (desktop), action buttons on the right. */
export function SiteHeader() {
  const scrolled = useScrolled(8);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  // Freeze body scroll without overflow:hidden so the scrollbar stays visible.
  // position:fixed + saved scrollY prevents keyboard/scrollbar from scrolling the page.
  useEffect(() => {
    if (!menuOpen) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-30 transition-colors duration-300 ${
          scrolled
            ? "border-b border-slate-900/10 bg-cream-50/95 dark:border-white/10 dark:bg-navy-950/95"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLockup />

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy-600 transition-colors duration-200 hover:text-gold-600 focus-visible:outline-none focus-visible:text-gold-600 dark:text-slate-300 dark:hover:text-gold-300 dark:focus-visible:text-gold-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center justify-end gap-2 md:flex">
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="flex cursor-pointer items-center rounded-md border border-slate-300 bg-transparent px-3.5 py-1.5 text-sm font-medium text-navy-700 transition-colors duration-200 hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/5"
            >
              Ask AI
            </button>
            <a
              href="/login"
              className="flex items-center rounded-md bg-navy-800 px-3.5 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
            >
              Log In
            </a>
          </div>

          {/* Mobile actions */}
          <div className="flex shrink-0 items-center justify-end gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="flex h-9 cursor-pointer items-center whitespace-nowrap rounded-full border border-slate-300 bg-transparent px-4 text-sm font-medium text-navy-700 transition-colors duration-200 hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/5"
            >
              Ask AI
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-slate-300 text-navy-700 transition-colors duration-200 hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/5"
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <MobileMenu links={NAV_LINKS} onClose={() => setMenuOpen(false)} />
        )}
      </AnimatePresence>

      {/* Ask AI slide-over */}
      <AskAiPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}

/** Full-screen mobile navigation drawer — scrollable content, floating X. */
function MobileMenu({
  links,
  onClose,
}: {
  links: readonly NavLink[];
  onClose: () => void;
}) {
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
        className="fixed right-4 top-3.5 z-50 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-slate-300 text-navy-700 transition-colors duration-200 hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/5"
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
        className="fixed inset-0 z-40 overflow-y-auto scrollbar-hide bg-cream-50 dark:bg-navy-950"
      >
        <div className="min-h-full px-5 pb-16 pt-20">
          {/* Log In — primary full-width */}
          <a
            href="/login"
            onClick={onClose}
            className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-navy-800 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
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
                className="flex cursor-pointer items-center justify-between border-b border-slate-200 py-4 text-base font-medium text-slate-900 transition-colors duration-200 hover:text-gold-600 dark:border-white/10 dark:text-white dark:hover:text-gold-300"
              >
                {link.label}
                <ChevronRightIcon size={16} />
              </a>
            ))}
          </nav>

          {/* Theme row */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-white/10">
            <span className="text-base font-sans font-medium text-slate-500 dark:text-slate-400">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </motion.div>
    </>
  );
}

/** Logo + name lockup — left-aligned. */
function BrandLockup() {
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
          className="size-8 object-contain sm:size-9"
        />
      </a>
      <span className="flex flex-col items-center text-center leading-none">
        <span className="font-display text-2xl tracking-wide text-navy-700 dark:text-white sm:text-[1.7rem]">
          GWC
        </span>
        <span className="-mt-2 font-sans text-[0.65rem] tracking-wide text-navy-500 dark:text-navy-300 sm:text-xs">
          Class Scheduling
        </span>
      </span>
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
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

/** Tracks whether the page has scrolled past a small threshold. */
function useScrolled(threshold: number): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
