import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { AuthGuard } from "~/auth/auth-guard";
import { ThemeProvider } from "~/components/theme/theme-provider";
import { LayoutSidebarIcon } from "~/components/ui/icons";
import { Toaster } from "~/components/ui/sonner";
import { TermContextProvider } from "~/features/academic-terms/term-context-provider";
import { useAuth } from "~/hooks/use-auth";
import { DashboardIntroOverlay, useJustLoggedIn } from "~/layouts/dashboard-intro";
import {
  Sidebar,
  loadSidebarMode,
  saveSidebarMode,
  type SidebarMode,
} from "~/layouts/sidebar";
import { StudentBottomNav } from "~/layouts/student-bottom-nav";
import { Topbar } from "~/layouts/topbar";

const MOBILE_QUERY = "(max-width: 1023px)";
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export default function AppShell() {
  return (
    <ThemeProvider>
      <AuthGuard>
        <TermContextProvider>
          <Shell />
        </TermContextProvider>
      </AuthGuard>
      <Toaster />
    </ThemeProvider>
  );
}

function Shell() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const justLoggedIn = useJustLoggedIn();
  const location = useLocation();
  const isSettingsRoute = location.pathname.startsWith("/settings");
  const [mode, setMode] = useState<SidebarMode>(() => loadSidebarMode());
  const [mobileOpen, setMobileOpen] = useState(false);

  const setModePersisted = useCallback((next: SidebarMode) => {
    setMode(next);
    saveSidebarMode(next);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia(MOBILE_QUERY).matches) {
      setMobileOpen((open) => !open);
    } else {
      setModePersisted(mode === "expanded" ? "collapsed" : "expanded");
    }
  }, [mode, setModePersisted]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        if (!window.matchMedia(MOBILE_QUERY).matches) {
          event.preventDefault();
          setModePersisted(mode === "expanded" ? "collapsed" : "expanded");
        }
      }
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mode, setModePersisted]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh bg-slate-50 dark:bg-surface">
      {justLoggedIn && <DashboardIntroOverlay />}

      {/* Desktop sidebar — settings routes use their own SettingsSidebar instead */}
      {!isSettingsRoute &&
        (mode === "expand-on-hover" ? (
          /* Expand-on-hover keeps a 60px rail in-flow and floats the expanded
             aside over the topbar/content so nothing reflows. */
          <div className="sticky top-0 z-40 hidden h-dvh w-15 shrink-0 lg:block">
            <Sidebar
              mode={mode}
              onModeChange={setModePersisted}
              onExpand={() => setModePersisted("expanded")}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        ) : (
          <motion.div
            className="sticky top-0 hidden h-dvh lg:block"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE_OUT } }}
          >
            <Sidebar
              mode={mode}
              onModeChange={setModePersisted}
              onExpand={() => setModePersisted("expanded")}
              onNavigate={() => setMobileOpen(false)}
            />
          </motion.div>
        ))}

      {/* Mobile drawer — for non-student roles */}
      {!isStudent && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className={`fixed inset-0 z-40 bg-slate-900/50 transition-opacity duration-200 lg:hidden ${
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
                className="absolute right-3 top-3 z-50 flex cursor-pointer items-center rounded-lg px-1 py-1 text-mist-100/80 transition-colors duration-150 hover:bg-white/10 hover:text-mist-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <span className="flex size-7 items-center justify-center">
                  <LayoutSidebarIcon size={16} />
                </span>
              </button>
              <Sidebar
                mode={mode}
                forceExpanded
                onModeChange={setModePersisted}
                onExpand={() => undefined}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        </>
      )}

      <motion.div
        className="flex min-w-0 flex-1 flex-col"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.05, ease: EASE_OUT } }}
      >
        {isStudent ? (
          <div className="hidden lg:block">
            <Topbar onToggleSidebar={toggleSidebar} />
          </div>
        ) : (
          <Topbar onToggleSidebar={toggleSidebar} />
        )}
        <main className={`min-w-0 flex-1 ${isStudent && location.pathname !== "/settings/change-password" && !location.pathname.startsWith("/profile/") ? "pb-20 lg:pb-0" : ""}`}>
          <Outlet />
        </main>
      </motion.div>

      {/* Fixed bottom navigation for students on mobile */}
      {isStudent && location.pathname !== "/settings/change-password" && !location.pathname.startsWith("/profile/") && <StudentBottomNav />}
    </div>
  );
}
