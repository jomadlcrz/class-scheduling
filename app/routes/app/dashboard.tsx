import { useEffect, useState } from "react";
import { useAuth } from "~/hooks/use-auth";
import { PageHeader } from "~/layouts/page-header";
import { fetchDashboardGreeting } from "~/services/dashboard.service";

export function meta() {
  return [
    { title: 'Dashboard — GWC Class Scheduling' },
  ];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchDashboardGreeting(user.role)
      .then((g) => { if (!cancelled) setGreeting(g); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Dashboard"
        description={
          greeting || (user ? "Dashboard" : "Overview of the current academic term.")
        }
      />
    </div>
  );
}
