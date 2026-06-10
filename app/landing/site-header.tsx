import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Colleges", href: "#colleges" },
  { label: "Get started", href: "#get-started" },
];

/** Sticky navbar: brand lockup on the left, nav links centered, theme toggle on the right. */
export function SiteHeader() {
  const scrolled = useScrolled(8);

  return (
    <header
      className={`sticky top-0 z-30 transition-colors duration-300 ${
        scrolled
          ? "border-b border-slate-900/10 bg-cream-50/95 dark:border-white/10 dark:bg-navy-950/95"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLockup />

        <nav className="hidden items-center justify-center gap-8 md:flex">
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

        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/** Logo (the only clickable element) beside the two-line name stack — left-aligned. */
function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <a
        href="#top"
        aria-label="GWC Class Scheduling — back to top"
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
        <span className="font-sans text-[0.65rem] tracking-wide text-navy-500 dark:text-navy-300 sm:text-xs">
          Class Scheduling
        </span>
      </span>
    </div>
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
