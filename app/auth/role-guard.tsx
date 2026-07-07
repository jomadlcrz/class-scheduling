import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { LoadingState } from "~/components/feedback/loading-state";
import type { Role } from "~/types/user";
import { useAuth } from "~/auth/auth-provider";

/**
 * Restricts a page to specific roles. Must render inside AuthGuard
 * (the AppShell provides it), so an authenticated user is guaranteed.
 */
export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingState />;
  if (!user || !allow.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
