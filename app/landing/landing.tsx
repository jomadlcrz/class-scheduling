import { Colleges } from "./colleges";
import { Cta } from "./cta";
import { Features } from "./features";
import { Hero } from "./hero";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { Stats } from "./stats";
import { ThemeProvider } from "./theme-provider";

/** The GWC Class Scheduling landing page. */
export function Landing() {
  return (
    <ThemeProvider>
      <div id="top" className="relative min-h-dvh overflow-x-clip">
        <Backdrop />
        <SiteHeader />
        <main className="relative z-10">
          <Hero />
          <Stats />
          <Features />
          <Colleges />
          <Cta />
        </main>
        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}

/** Layered atmosphere: cover photo, blueprint grid, and navy + gold glows. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 sm:fixed">
      {/* Cover image — faint, behind a theme-matched scrim. */}
      <img
        src="/images/covers/home-cover.avif"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-[0.06] dark:opacity-[0.10]"
      />
      {/* Blueprint timetable grid. */}
      <div className="blueprint-grid absolute inset-0 text-navy-900/6 dark:text-white/5" />
      {/* Gold radial glow, top-center — radial-gradient skips the GPU blur filter pass. */}
      <div
        className="absolute -top-40 left-1/2 size-160 -translate-x-1/2 opacity-20 dark:opacity-[0.15]"
        style={{ background: "radial-gradient(circle, rgb(212 175 55) 0%, transparent 65%)" }}
      />
      {/* Navy depth glow, lower-left. */}
      <div
        className="absolute top-1/3 -left-32 size-128 opacity-[0.15] dark:opacity-25"
        style={{ background: "radial-gradient(circle, rgb(30 58 110) 0%, transparent 65%)" }}
      />
      {/* Bottom fade into the base surface. */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-cream-50 to-transparent dark:from-navy-950" />
    </div>
  );
}
