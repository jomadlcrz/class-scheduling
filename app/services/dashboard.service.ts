import { apiGet } from "~/lib/api";
import type { Role } from "~/types/user";

const DASHBOARD_ENDPOINTS: Record<Role, string> = {
  admin: "/super-admin/protected-dashboard",
  registrar: "/registrar-admin/protected-dashboard",
  dean: "/deans/protected-dashboard",
  faculty: "/instructor/protected-dashboard",
  student: "/students/protected-dashboard",
};

type DashboardResponse = {
  user_name: string;
  date_time: string;
  message: string;
};

export type DashboardGreeting = {
  userName: string;
  dateTime: string;
  message: string;
};

export async function fetchDashboardGreeting(role: Role): Promise<DashboardGreeting> {
  const endpoint = DASHBOARD_ENDPOINTS[role];
  const data = await apiGet<DashboardResponse>(endpoint);
  return {
    userName: data.user_name,
    dateTime: data.date_time,
    message: data.message,
  };
}
