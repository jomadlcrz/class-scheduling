import { apiGet } from "~/lib/api";
import type { Role } from "~/types/user";

const DASHBOARD_ENDPOINTS: Record<Role, string> = {
  admin: "/super-admin/protected-dashboard",
  registrar: "/registrar-admin/protected-dashboard",
  dean: "/deans/protected-dashboard",
  faculty: "/faculty/protected-dashboard",
  student: "/students/protected-dashboard",
};

type DashboardResponse = {
  user_name: string;
};

export async function fetchDashboardGreeting(role: Role): Promise<string> {
  const endpoint = DASHBOARD_ENDPOINTS[role];
  const data = await apiGet<DashboardResponse>(endpoint);
  return data.user_name;
}
