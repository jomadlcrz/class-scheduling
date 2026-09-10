import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import {
  BellIcon,
  CalendarIcon,
  DashboardIcon,
  FileTextIcon,
  UserIcon,
} from "~/components/ui/icons";
import { notificationService } from "~/services/notification.service";

type TabItem = {
  label: string;
  to: string;
  icon: typeof DashboardIcon;
  exact?: boolean;
};

const TABS: TabItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: DashboardIcon },
  { label: "Schedule", to: "/student-schedule", icon: CalendarIcon },
  { label: "COR", to: "/registration", icon: FileTextIcon },
  { label: "Notifications", to: "/notifications", icon: BellIcon },
  { label: "Profile", to: "/profile", icon: UserIcon },
];

export function StudentBottomNav() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [badgeDismissed, setBadgeDismissed] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function fetchUnread() {
      try {
        const res = await notificationService.list({ page: 1, per_page: 1, unread_only: true });
        if (mounted) {
          setUnreadCount(res.unreadCount ?? 0);
        }
      } catch {
        // Soft fail if offline
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // When student visits notifications tab, dismiss tab badge (items stay unread)
  useEffect(() => {
    if (location.pathname === "/notifications") {
      setBadgeDismissed(true);
    }
  }, [location.pathname]);

  const visibleBadge = badgeDismissed ? 0 : unreadCount;

  return (
    <nav
      aria-label="Student Portal Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-1px_3px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-surface-raised/95 lg:hidden"
    >
      {TABS.map((tab) => {
        const IconComponent = tab.icon;
        const isNotifTab = tab.to === "/notifications";
        const isProfileTab = tab.to === "/profile";
        const isActive =
          location.pathname === tab.to ||
          (isProfileTab && (location.pathname === "/profile" || location.pathname.startsWith("/settings")));

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`relative flex flex-1 flex-col items-center justify-center py-1 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gwc-blue dark:focus-visible:ring-gwc-blue-bright ${
              isActive
                ? "font-bold text-gwc-blue dark:text-gwc-blue-bright"
                : "text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-mist-100"
            }`}
          >
            <div className="relative">
              <IconComponent />
              {isNotifTab && visibleBadge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-xs">
                  {visibleBadge > 99 ? "99+" : visibleBadge}
                </span>
              )}
            </div>
            <span className="mt-1 text-[11px] leading-tight tracking-tight">
              {tab.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
