import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { LoadingState } from "~/components/feedback/loading-state";
import { useAuth } from "~/auth/auth-provider";

/**
 * Protects authenticated routes: waits for the session to resolve,
 * redirects guests to /login, and forces the change-password flow
 * when the account requires it.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password?force=true" replace />;

  return <>{children}</>;
}
