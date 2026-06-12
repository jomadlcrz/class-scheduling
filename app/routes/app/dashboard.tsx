import { useAuth } from "../../hooks/use-auth";
import { PageHeader } from "../../layouts/page-header";

export function meta() {
  return [
    { title: "Dashboard — GWC Class Scheduling" },
    {
      name: "description",
      content: "Your GWC Class Scheduling dashboard.",
    },
  ];
}

const PLACEHOLDER_STATS = ["Schedules", "Sections", "Faculty", "Rooms"] as const;

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={user ? `Welcome back, ${user.name}.` : undefined}
      />

      {/* Placeholder stats until the dashboard widgets are built. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLACEHOLDER_STATS.map((label) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
          >
            <p className="font-sans text-sm text-slate-500 dark:text-navy-300">{label}</p>
            <p className="mt-1 font-display text-3xl tracking-wide text-navy-700 dark:text-white">
              —
            </p>
            <p className="mt-1 font-sans text-xs text-slate-400 dark:text-slate-500">
              Coming soon
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
