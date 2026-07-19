import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router";
import { AuthGuard } from "~/auth/auth-guard";
import { ThemeProvider } from "~/components/theme/theme-provider";
import { LayoutSidebarIcon } from "~/components/ui/icons";
import { Toaster } from "~/components/ui/sonner";
import { DashboardIntroOverlay, useJustLoggedIn } from "~/layouts/dashboard-intro";
import { Navbar } from "~/layouts/navbar";
import { Sidebar } from "~/layouts/sidebar";

const COLLAPSED_KEY = "cs-sidebar-collapsed";
const MOBILE_QUERY = "(max-width: 1023px)";
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export default function AppShell() {
  return (
    <ThemeProvider>
      <AuthGuard>
        <Shell />
      </AuthGuard>
      <Toaster />
    </ThemeProvider>
  );
}

function Shell() {
  const justLoggedIn = useJustLoggedIn();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const setCollapsedPersisted = useCallback((next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // storage unavailable
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia(MOBILE_QUERY).matches) {
      setMobileOpen((open) => !open);
    } else {
      setCollapsedPersisted(!collapsed);
    }
  }, [collapsed, setCollapsedPersisted]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        if (!window.matchMedia(MOBILE_QUERY).matches) {
          event.preventDefault();
          setCollapsedPersisted(!collapsed);
        }
      }
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [collapsed, setCollapsedPersisted]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh bg-slate-50 dark:bg-surface">
      {justLoggedIn && <DashboardIntroOverlay />}

      {/* Desktop sidebar */}
      <motion.div
        className="sticky top-0 hidden h-dvh lg:block"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE_OUT } }}
      >
        <Sidebar
          collapsed={collapsed}
          onExpand={() => setCollapsedPersisted(false)}
          onNavigate={() => setMobileOpen(false)}
        />
      </motion.div>

      {/* Mobile drawer */}
      <>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className={`fixed inset-0 z-30 bg-slate-900/50 transition-opacity duration-200 lg:hidden ${
            mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
        <div
          className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out lg:hidden ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="relative">
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-50 grid size-8 cursor-pointer place-items-center rounded-md text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <LayoutSidebarIcon size={16} />
            </button>
            <Sidebar
              collapsed={false}
              onExpand={() => undefined}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      </>

      <motion.div
        className="flex min-w-0 flex-1 flex-col"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.05, ease: EASE_OUT } }}
      >
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}
