import { ThemeProvider } from "./theme-provider";
import { SiteHeader } from "./site-header";
import { Hero } from "./hero";
import { Stats } from "./stats";
import { Features } from "./features";
import { Colleges } from "./colleges";
import { Cta } from "./cta";
import { SiteFooter } from "./site-footer";

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
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {/* Cover image — faint, behind a theme-matched scrim. */}
      <img
        src="/images/covers/home-cover.avif"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-[0.06] dark:opacity-[0.10]"
      />
      {/* Blueprint timetable grid. */}
      <div className="blueprint-grid absolute inset-0 text-navy-900/[0.06] dark:text-white/[0.05]" />
      {/* Gold radial glow, top-center. */}
      <div className="absolute -top-40 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-gold-400/20 blur-3xl dark:bg-gold-400/15" />
      {/* Navy depth glow, lower-left. */}
      <div className="absolute top-1/3 -left-32 size-[32rem] rounded-full bg-navy-400/15 blur-3xl dark:bg-navy-500/25" />
      {/* Fine grain texture for premium depth. */}
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-soft-light dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Bottom fade into the base surface. */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-cream-50 to-transparent dark:from-navy-950" />
    </div>
  );
}
