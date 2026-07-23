import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { MobileMenu } from "~/landing/mobile-menu";

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
            ? "border-b border-navy-500/30 bg-navy-400/95 dark:border-white/10 dark:bg-surface/95"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLockup scrolled={scrolled} />

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 focus-visible:outline-none ${
                  scrolled
                    ? "text-white hover:text-gold-300 focus-visible:text-gold-300 dark:text-slate-300 dark:hover:text-gold-300 dark:focus-visible:text-gold-300"
                    : "text-navy-700 hover:text-gold-600 focus-visible:text-gold-600 dark:text-slate-300 dark:hover:text-gold-300 dark:focus-visible:text-gold-300"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center justify-end gap-2 md:flex">
            <a
              href="/login"
              className={`flex items-center rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                scrolled
                  ? "bg-white text-navy-800 hover:bg-slate-100 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
                  : "bg-navy-800 text-white hover:bg-navy-700 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100"
              }`}
            >
              Log In
            </a>
          </div>

          {/* Mobile actions */}
          <div className="flex shrink-0 items-center justify-end gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className={`grid size-9 shrink-0 cursor-pointer place-items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                scrolled
                  ? "text-white hover:bg-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                  : "text-navy-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
              }`}
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
    </>
  );
}

/** Logo + name lockup — left-aligned. White logo in dark mode only when requested. */
function BrandLockup({ whiteOnDark = false, scrolled = false }: { whiteOnDark?: boolean; scrolled?: boolean }) {
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
        <span className={`font-display text-2xl tracking-wide sm:text-[1.7rem] ${scrolled ? "text-white dark:text-mist-100" : "text-navy-700 dark:text-mist-100"}`}>
          GWC
        </span>
        <span className={`-mt-2 font-body text-[0.65rem] tracking-wide sm:text-xs ${scrolled ? "text-gwc-blue-soft dark:text-navy-300" : "text-navy-500 dark:text-navy-300"}`}>
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
