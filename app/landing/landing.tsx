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
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 contain-strict">
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
      {/* Fine grain texture for premium depth. */}
      <div
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Bottom fade into the base surface. */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-cream-50 to-transparent dark:from-navy-950" />
    </div>
  );
}
