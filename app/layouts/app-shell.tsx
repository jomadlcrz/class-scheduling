import { useState } from "react";
import { Outlet } from "react-router";
import { AuthGuard } from "../auth/auth-guard";
import { ThemeProvider } from "../components/theme/theme-provider";
import { MobileNav } from "./mobile-nav";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

/**
 * Layout route for every authenticated page: theme + auth guard + the
 * sidebar/navbar chrome. Pages render into the <Outlet /> and only
 * provide their own content (start with PageHeader).
 */
export default function AppShell() {
  return (
    <ThemeProvider>
      <AuthGuard>
        <Shell />
      </AuthGuard>
    </ThemeProvider>
  );
}

function Shell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative flex min-h-dvh bg-cream-50 dark:bg-navy-950">
      {/* Signature blueprint texture behind the content. */}
      <div
        aria-hidden="true"
        className="blueprint-grid pointer-events-none fixed inset-0 text-navy-900/4 dark:text-white/4"
      />

      <Sidebar />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Navbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
}
