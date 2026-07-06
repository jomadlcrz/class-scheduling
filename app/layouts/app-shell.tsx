import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router";
import { AuthGuard } from "../auth/auth-guard";
import { ThemeProvider } from "../components/theme/theme-provider";
import { MobileNav } from "./mobile-nav";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

const COLLAPSED_KEY = "cs-sidebar-collapsed";
// Must match the `lg:` visibility breakpoint on the desktop sidebar.
const MOBILE_QUERY = "(max-width: 1023px)";

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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Restore the persisted desktop collapse state after hydration.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // storage unavailable — stay expanded
    }
  }, []);

  const setCollapsedPersisted = useCallback((next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // storage unavailable — in-memory only
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia(MOBILE_QUERY).matches) {
      setMobileNavOpen((open) => !open);
    } else {
      setCollapsedPersisted(!collapsed);
    }
  }, [collapsed, setCollapsedPersisted]);

  // Ctrl/Cmd+B collapses on desktop (legacy shortcut).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        if (!window.matchMedia(MOBILE_QUERY).matches) {
          event.preventDefault();
          setCollapsedPersisted(!collapsed);
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [collapsed, setCollapsedPersisted]);

  return (
    <div className="flex min-h-dvh bg-slate-50 dark:bg-navy-950">
      <Sidebar collapsed={collapsed} onExpand={() => setCollapsedPersisted(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 px-4 py-4 sm:px-5 lg:px-6">
          <Outlet />
        </main>
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
}
