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
    <footer className="relative z-10 border-t border-slate-200 bg-cream-100 text-slate-600 dark:border-white/10 dark:bg-surface dark:text-slate-300">
      {/* Hairline gold accent along the top edge. */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-gold-400/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
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
                <span className="font-display text-3xl tracking-wide text-navy-700 dark:text-mist-100">
                  GWC
                </span>
                <span className="-mt-2 font-body text-sm tracking-wide text-navy-500 dark:text-navy-300">
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
              <h3 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
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
      </div>

      {/* Bottom bar — its own container/background, distinct from the main footer above. */}
      <div className="bg-navy-800 dark:bg-navy-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row sm:px-8 lg:px-10">
          <p className="text-xs text-mist-100/50">
            &copy; {new Date().getFullYear()} GWC Class Scheduling. All rights reserved.
          </p>
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <div className="flex items-center gap-5">
              <a
                href="/privacy-policy"
                className="text-xs text-mist-100/50 transition-colors duration-200 hover:text-gold-400 focus-visible:text-gold-400 focus-visible:outline-none"
              >
                Privacy Policy
              </a>
              <a
                href="/terms-of-use"
                className="text-xs text-mist-100/50 transition-colors duration-200 hover:text-gold-400 focus-visible:text-gold-400 focus-visible:outline-none"
              >
                Terms of Use
              </a>
            </div>
            <a
              href="#"
              aria-label="GWC Class Scheduling on Facebook"
              className="text-mist-100/50 transition-colors duration-200 hover:text-gold-400 focus-visible:text-gold-400 focus-visible:outline-none"
            >
              <FacebookIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}
