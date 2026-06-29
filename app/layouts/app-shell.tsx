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
    <div className="flex min-h-dvh bg-slate-50 dark:bg-navy-950">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 py-4 sm:px-5 lg:px-6">
          <Outlet />
        </main>
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
}
