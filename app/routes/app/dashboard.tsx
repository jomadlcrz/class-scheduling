import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuth } from "~/hooks/use-auth";
import { fadeUp, staggerContainer } from "~/landing/motion";
import { PageHeader } from "~/layouts/page-header";
import { fetchDashboardGreeting, type DashboardGreeting } from "~/services/dashboard.service";
import { DeanDashboard } from "~/features/dashboard/dean-dashboard";
import type { Role } from "~/types/user";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  registrar: "Registrar",
  dean: "Dean",
  faculty: "Faculty",
  student: "Student",
};

const ROLE_PORTAL: Record<Role, string> = {
  admin: "administrator",
  registrar: "registrar",
  dean: "dean",
  faculty: "faculty",
  student: "student",
};

function portalMessage(role: Role): string {
  return `Welcome back! Here's what's happening in your ${ROLE_PORTAL[role]} portal today.`;
}

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
      <motion.div variants={fadeUp}>
        {greeting && user && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {greeting.userName}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {greeting.dateTime}
            </p>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
              {portalMessage(user.role)}
            </p>
          </div>
        )}
      </motion.div>

      {user?.role === "dean" ? (
        <DeanDashboard />
      ) : (
        <motion.div variants={fadeUp}>
          <PageHeader
            title="Dashboard"
            description="Overview of the current academic term."
          />
        </motion.div>
      )}
    </motion.div>
  );
}
