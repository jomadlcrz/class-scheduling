import { AmbientBackground } from "~/components/ui/ambient-background";
import { Colleges } from "~/landing/colleges";
import { Features } from "~/landing/features";
import { Hero } from "~/landing/hero";
import { SiteFooter } from "~/landing/site-footer";
import { SiteHeader } from "~/landing/site-header";
import { Stats } from "~/landing/stats";
import { ThemeProvider } from "~/components/theme/theme-provider";

/** The GWC Class Scheduling landing page. */
export function Landing() {
  return (
    <ThemeProvider>
      <div id="top" className="relative min-h-dvh overflow-x-clip">
        <AmbientBackground variant="landing" />
        <SiteHeader />
        <main className="relative z-10">
          <Hero />
          <Stats />
          <Features />
          <Colleges />
        </main>
        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}
