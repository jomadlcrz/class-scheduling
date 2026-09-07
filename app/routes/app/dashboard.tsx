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

import { ScreenHeader } from "~/components/ui/screen-header";

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

  const isStudent = user?.role === "student";

  return (
    <div className="flex w-full flex-col">
      {isStudent && (
        <ScreenHeader title="GWC Class Scheduling" className="lg:hidden" />
      )}
      <motion.div
        className={`mx-auto w-full max-w-7xl ${
          isStudent ? "px-4 py-4 sm:py-6 lg:py-8" : "px-4 py-8"
        }`}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {greeting && user && !isStudent && (
          <GreetingsCard greeting={greeting} />
        )}
        {greeting && user && isStudent && (
          <div className="hidden lg:block">
            <GreetingsCard greeting={greeting} />
          </div>
        )}

        {user?.role === "dean" && <DeanDashboard />}
        {user?.role === "registrar" && <RegistrarDashboard />}
        {user?.role === "admin" && <SuperAdminDashboard />}
        {user?.role === "faculty" && <FacultyDashboard />}
        {user?.role === "student" && <StudentDashboard />}
      </motion.div>
    </div>
  );
}
