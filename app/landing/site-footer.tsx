import { ThemeToggle } from "./theme-toggle";

interface FooterColumn {
  heading: string;
  links: readonly string[];
}

const COLUMNS: readonly FooterColumn[] = [
  { heading: "Product", links: ["Features", "Schedule builder", "Conflict checks", "Publishing"] },
  { heading: "Colleges", links: ["CITE", "CBA", "COC", "COED"] },
  { heading: "Resources", links: ["Documentation", "Support", "Status", "Changelog"] },
];


/** Site footer — follows the theme: light surface in light mode, navy in dark. */
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-cream-100 text-slate-600 dark:border-white/10 dark:bg-navy-950 dark:text-slate-300">
      {/* Hairline gold accent along the top edge. */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-gold-400/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              {/* Colored mark on the light footer, white mark on the dark footer. */}
              <a
                href="/"
                aria-label="GWC Class Scheduling — home"
                className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                <img
                  src="/images/logos/gwc-logo.avif"
                  alt="GWC logo"
                  width={40}
                  height={40}
                  loading="lazy"
                  className="size-10 object-contain dark:hidden"
                />
                <img
                  src="/images/logos/gwc-logo-white.avif"
                  alt="GWC logo"
                  width={40}
                  height={40}
                  loading="lazy"
                  className="hidden size-10 object-contain dark:block"
                />
              </a>
              <span className="flex flex-col items-center text-center leading-none">
                <span className="font-display text-3xl tracking-wide text-navy-700 dark:text-white">
                  GWC
                </span>
                <span className="-mt-2 font-sans text-sm tracking-wide text-navy-500 dark:text-navy-300">
                  Class Scheduling
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Conflict-free academic timetables for Golden West Colleges, Inc. and
              every department within it.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h3 className="font-display text-lg tracking-wide text-navy-700 dark:text-white">
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-500 transition-colors duration-200 hover:text-gold-600 focus-visible:text-gold-600 focus-visible:outline-none dark:text-slate-400 dark:hover:text-gold-300 dark:focus-visible:text-gold-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-white/10 sm:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} GWC Class Scheduling. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="/privacy-policy"
              className="text-xs text-slate-500 transition-colors duration-200 hover:text-gold-600 focus-visible:text-gold-600 focus-visible:outline-none dark:text-slate-400 dark:hover:text-gold-300 dark:focus-visible:text-gold-300"
            >
              Privacy Policy
            </a>
            <a
              href="/terms-of-use"
              className="text-xs text-slate-500 transition-colors duration-200 hover:text-gold-600 focus-visible:text-gold-600 focus-visible:outline-none dark:text-slate-400 dark:hover:text-gold-300 dark:focus-visible:text-gold-300"
            >
              Terms of Use
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
