import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { LoadingState } from "~/components/feedback/loading-state";
import { useAuth } from "~/auth/auth-provider";

/** Keeps logged-in users out of guest-only pages (e.g. /login). */
export function GuestGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingState />;
  if (user) {
    return (
      <Navigate
        to={user.mustChangePassword ? "/change-password" : "/dashboard"}
        replace
      />
    );
  }

  return <>{children}</>;
}
