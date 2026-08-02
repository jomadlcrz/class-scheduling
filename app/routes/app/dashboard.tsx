import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuth } from "~/hooks/use-auth";
import { staggerContainer } from "~/landing/motion";
import { fetchDashboardGreeting, type DashboardGreeting } from "~/services/dashboard.service";
import { DeanDashboard } from "~/features/dashboard/dean-dashboard";
import { GreetingsCard } from "~/features/dashboard/greetings-card";
import { RegistrarDashboard } from "~/features/dashboard/registrar-dashboard";
import { SelfAnalyticsDashboard } from "~/features/dashboard/self-analytics-dashboard";

export function meta() {
  return [
    { title: 'Dashboard — GWC Class Scheduling' },
  ];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState<DashboardGreeting | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchDashboardGreeting(user.role)
      .then((g) => { if (!cancelled) setGreeting(g); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  return (
    <motion.div
      className="mx-auto max-w-6xl px-4 py-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {greeting && user && (
        <GreetingsCard greeting={greeting} />
      )}

      {user?.role === "dean" && <DeanDashboard />}
      {user?.role === "registrar" && <RegistrarDashboard />}
      {(user?.role === "admin" || user?.role === "faculty" || user?.role === "student") && (
        <SelfAnalyticsDashboard />
      )}
    </motion.div>
  );
}
