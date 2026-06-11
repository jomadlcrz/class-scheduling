import type { ReactNode } from "react";
import { ThemeProvider } from "../components/theme/theme-provider";
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
        {/* Ambient background */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <div className="blueprint-grid absolute inset-0 text-navy-900/6 dark:text-white/5" />
          <div
            className="absolute -top-40 left-1/2 size-160 -translate-x-1/2 opacity-[0.12] dark:opacity-[0.08]"
            style={{ background: "radial-gradient(circle, rgb(212 175 55) 0%, transparent 65%)" }}
          />
        </div>

        <SiteHeader />

        {/* ── Full-width page title bar ── */}
        <div className="relative z-10 border-b border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <h1 className="font-display text-4xl tracking-wide text-navy-700 dark:text-white sm:text-[2.75rem]">
              {title}
            </h1>
          </div>
        </div>

        {/* ── Main layout ── */}
        <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex gap-8 lg:gap-10">
            {/* ── Left sidebar — flat, no card ── */}
            <aside className="hidden lg:block w-52 xl:w-60 shrink-0">
              <div className="sticky top-24">
                <nav
                  aria-label="Legal pages"
                  className="overflow-hidden rounded-sm border border-slate-200 bg-white/90 divide-y divide-slate-200 dark:border-white/10 dark:bg-navy-800/60 dark:divide-white/10"
                >
                  <SidebarLink href="/privacy-policy" active={activePage === "privacy-policy"}>
                    Privacy Policy
                  </SidebarLink>
                  <SidebarLink href="/terms-of-use" active={activePage === "terms-of-use"}>
                    Terms of Use
                  </SidebarLink>
                </nav>
              </div>
            </aside>

            {/* ── Content ── */}
            <div className="flex-1 min-w-0">
              {/* Mobile tab switcher */}
              <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-white/80 p-1 backdrop-blur-sm dark:border-white/10 dark:bg-navy-800/60 lg:hidden">
                <MobileTab href="/privacy-policy" active={activePage === "privacy-policy"}>
                  Privacy Policy
                </MobileTab>
                <MobileTab href="/terms-of-use" active={activePage === "terms-of-use"}>
                  Terms of Use
                </MobileTab>
              </div>

              <div className="rounded-sm border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-navy-800/60">
                {/* Intro */}
                <div className="border-b border-slate-200 px-8 py-8 dark:border-white/10 sm:px-12">
                  <p className="font-sans text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {intro}
                  </p>
                </div>

                {/* Sections */}
                <div className="divide-y divide-slate-100 px-8 dark:divide-white/5 sm:px-12">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}

/** Individual section block shared by both legal pages. */
export function LegalSection({ id, heading, body }: { id: string; heading: string; body: string }) {
  return (
    <section id={id} className="scroll-mt-24 py-8">
      <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-white">
        {heading}
      </h2>
      <p className="mt-3 font-sans text-sm leading-7 text-slate-600 dark:text-slate-300">
        {body}
      </p>
    </section>
  );
}

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative block cursor-pointer px-4 py-3 font-sans text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-gold-400 ${
        active
          ? "bg-white/90 font-semibold text-navy-700 dark:bg-navy-800/80 dark:text-white"
          : "text-slate-500 hover:bg-slate-50 hover:text-navy-600 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
      }`}
    >
      {active && (
        <span
          className="absolute left-0 inset-y-0 w-0.5 bg-gold-400"
          aria-hidden="true"
        />
      )}
      <span className="pl-1">{children}</span>
    </a>
  );
}

function MobileTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex-1 cursor-pointer rounded-md px-4 py-2 text-center font-sans text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
        active
          ? "bg-navy-800 text-white dark:bg-white dark:text-navy-900"
          : "text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
      }`}
    >
      {children}
    </a>
  );
}
