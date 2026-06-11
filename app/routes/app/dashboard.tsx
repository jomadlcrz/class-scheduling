import { useNavigate } from "react-router";
import { AuthGuard } from "../../auth/auth-guard";
import { AmbientBackground } from "../../auth/auth-layout";
import { ThemeProvider } from "../../components/theme/theme-provider";
import { useAuth } from "../../hooks/use-auth";

export function meta() {
  return [
    { title: "Dashboard — GWC Class Scheduling" },
    {
      name: "description",
      content: "Your GWC Class Scheduling dashboard.",
    },
  ];
}

export default function Dashboard() {
  return (
    <ThemeProvider>
      <AuthGuard>
        <DashboardPage />
      </AuthGuard>
    </ThemeProvider>
  );
}

/** Placeholder until the app shell (sidebar/navbar) and widgets are built. */
function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-cream-50 dark:bg-navy-950">
      <AmbientBackground />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-4xl tracking-wide text-navy-700 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 font-sans text-sm text-slate-500 dark:text-navy-300">
          Logged in as <span className="font-medium">{user?.name}</span> ({user?.role})
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 cursor-pointer rounded-lg border border-slate-300 px-5 py-2.5 font-sans text-sm font-medium text-navy-700 transition-colors duration-150 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
