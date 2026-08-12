import { motion } from "motion/react";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { staggerContainer } from "~/landing/motion";
import { fetchDashboardGreeting, type DashboardGreeting } from "~/services/dashboard.service";
import { DeanDashboard } from "~/features/dashboard/dean-dashboard";
import { FacultyDashboard } from "~/features/dashboard/faculty-dashboard";
import { GreetingsCard } from "~/features/dashboard/greetings-card";
import { RegistrarDashboard } from "~/features/dashboard/registrar-dashboard";
import { StudentDashboard } from "~/features/dashboard/student-dashboard";
import { SuperAdminDashboard } from "~/features/dashboard/super-admin-dashboard";

export function meta() {
  return [
    { title: 'Dashboard — GWC Class Scheduling' },
  ];
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: greeting } = useCachedData<DashboardGreeting>(
    "dashboard:greeting",
    () => fetchDashboardGreeting(user!.role),
    { enabled: !!user },
  );

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
      {user?.role === "admin" && <SuperAdminDashboard />}
      {user?.role === "faculty" && <FacultyDashboard />}
      {user?.role === "student" && <StudentDashboard />}
    </motion.div>
  );
}
