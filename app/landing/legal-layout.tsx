import type { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

type LegalPage = "privacy-policy" | "terms-of-use";

interface LegalLayoutProps {
  activePage: LegalPage;
  title: string;
  intro: string;
  children: ReactNode;
}

export function LegalLayout({ activePage, title, intro, children }: LegalLayoutProps) {
  return (
    <ThemeProvider>
      <div className="relative min-h-dvh overflow-x-clip bg-cream-50 dark:bg-navy-950">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <div className="blueprint-grid absolute inset-0 text-navy-900/6 dark:text-white/5" />
        </div>

        <SiteHeader />

        <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex gap-8 lg:gap-10">
            {/* ── Left sidebar ── */}
            <aside className="hidden lg:block w-52 xl:w-60 shrink-0">
              <div className="sticky top-24">
                <nav aria-label="Legal pages">
                  <SidebarLink
                    href="/privacy-policy"
                    active={activePage === "privacy-policy"}
                    position={activePage === "terms-of-use" ? "above-active" : "active"}
                  >
                    Privacy Policy
                  </SidebarLink>
                  <SidebarLink
                    href="/terms-of-use"
                    active={activePage === "terms-of-use"}
                    position={activePage === "privacy-policy" ? "below-active" : "active"}
                  >
                    Terms of Use
                  </SidebarLink>
                </nav>
              </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-8 py-10 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-navy-800/60 sm:px-12 sm:py-12">
                <div className="border-b border-slate-200 pb-8 dark:border-white/10">
                  <h1 className="font-display text-4xl tracking-wide text-navy-700 dark:text-white sm:text-5xl">
                    {title}
                  </h1>
                  <p className="mt-3 font-sans text-sm text-slate-500 dark:text-navy-300">
                    Effective date: June 10, 2026 &nbsp;·&nbsp; Gateways Western College
                  </p>
                  <p className="mt-4 font-sans text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {intro}
                  </p>
                </div>
                <div className="mt-10 space-y-10">{children}</div>
              </div>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}

/** Individual section block — used by both legal route files. */
export function LegalSection({
  id,
  heading,
  body,
}: {
  id: string;
  heading: string;
  body: string;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-white">
        {heading}
      </h2>
      <p className="mt-2.5 font-sans text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {body}
      </p>
    </section>
  );
}

type SidebarPosition = "active" | "above-active" | "below-active";

function SidebarLink({
  href,
  active,
  position,
  children,
}: {
  href: string;
  active: boolean;
  position: SidebarPosition;
  children: ReactNode;
}) {
  const borderClass =
    position === "below-active"
      ? "border-x border-b border-slate-200 dark:border-white/10"
      : position === "above-active"
        ? "border border-b-0 border-slate-200 dark:border-white/10"
        : "border border-slate-200 dark:border-white/10";

  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block cursor-pointer px-4 py-3 font-sans text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-gold-400 ${borderClass} ${
        active
          ? "bg-white/90 font-semibold text-navy-700 dark:bg-navy-800/80 dark:text-white"
          : "text-slate-500 hover:bg-slate-50 hover:text-navy-600 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
      }`}
    >
      {children}
    </a>
  );
}
