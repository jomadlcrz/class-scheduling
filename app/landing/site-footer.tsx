interface FooterColumn {
  heading: string;
  links: readonly string[];
}

const COLUMNS: readonly FooterColumn[] = [
  { heading: "Product", links: ["Features", "Schedule builder", "Conflict checks", "Publishing"] },
  { heading: "Colleges", links: ["CITE", "CBA", "COC", "COED"] },
  { heading: "Resources", links: ["Documentation", "Support", "Status", "Changelog"] },
];

const SOCIALS: readonly { label: string; href: string; icon: string }[] = [
  { label: "GitHub", href: "#", icon: "M12 2A10 10 0 0 0 8.84 21.5c.5.08.66-.23.66-.5v-1.7C6.73 19.91 6.14 18 6.14 18A2.69 2.69 0 0 0 5 16.5c-.91-.62.07-.6.07-.6a2.1 2.1 0 0 1 1.53 1 2.15 2.15 0 0 0 2.91.83 2.16 2.16 0 0 1 .63-1.34C8 16.17 5.62 15.31 5.62 11.5a3.87 3.87 0 0 1 1-2.71 3.58 3.58 0 0 1 .1-2.64s.84-.27 2.75 1a9.63 9.63 0 0 1 5 0c1.91-1.29 2.75-1 2.75-1a3.58 3.58 0 0 1 .1 2.64 3.87 3.87 0 0 1 1 2.71c0 3.82-2.34 4.66-4.57 4.91a2.39 2.39 0 0 1 .69 1.85V21c0 .27.16.59.67.5A10 10 0 0 0 12 2z" },
  { label: "X", href: "#", icon: "M18.9 2H22l-7.3 8.3L23 22h-6.8l-5.3-6.9L4.8 22H1.7l7.8-8.9L1 2h6.9l4.8 6.3L18.9 2z" },
];

/** Site footer — follows the theme: light surface in light mode, navy in dark. */
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-cream-100 text-slate-600 dark:border-white/10 dark:bg-navy-950 dark:text-slate-300">
      {/* Hairline gold accent along the top edge. */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              {/* Colored mark on the light footer, white mark on the dark footer. */}
              <a
                href="#top"
                aria-label="GWC Class Scheduling — back to top"
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
                <span className="-mt-0.5 font-sans text-sm tracking-wide text-navy-500 dark:text-navy-300">
                  Class Scheduling
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Conflict-free academic timetables for Gateways Western College and
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
          <div className="flex items-center gap-3">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="grid size-10 place-items-center rounded-full border border-slate-300 text-slate-500 transition-colors duration-200 hover:border-gold-400/60 hover:text-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:text-slate-400 dark:hover:border-gold-400/40 dark:hover:text-gold-300"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={social.icon} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
