import { useEffect, useMemo, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { EmptyState } from "~/components/feedback/empty-state";
import { Card } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { useAuth } from "~/hooks/use-auth";
import {
  selfAnalyticsService,
  type SelfAnalytics,
} from "~/services/self-analytics.service";

function labelFor(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: string | number | boolean) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  return value;
}

/** Renders the role's self-scoped analytics summary returned by the backend. */
export function SelfAnalyticsDashboard() {
  const { user } = useAuth();
  const { context, loading: termLoading } = useTermContext();
  const [analytics, setAnalytics] = useState<SelfAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syId = context?.selection.syId ?? null;
  const semId = context?.selection.semId ?? null;
  const needsTerm = user?.role === "faculty" || user?.role === "student";

  useEffect(() => {
    if (!user || !["admin", "faculty", "student"].includes(user.role)) return;
    if (needsTerm && (syId == null || semId == null)) {
      setAnalytics(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    const request =
      user.role === "admin"
        ? selfAnalyticsService.getAdmin()
        : user.role === "faculty"
          ? selfAnalyticsService.getFaculty(syId!, semId!)
          : selfAnalyticsService.getStudent(syId!, semId!);

    request
      .then((result) => {
        if (!cancelled) setAnalytics(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setAnalytics(null);
          setError(err instanceof Error ? err.message : "");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [needsTerm, semId, syId, user]);

  const summary = useMemo(() => {
    const raw = analytics?.summary;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    return Object.entries(raw).filter(
      (entry): entry is [string, string | number | boolean] =>
        typeof entry[1] === "string" ||
        typeof entry[1] === "number" ||
        typeof entry[1] === "boolean",
    );
  }, [analytics]);

  const definitions =
    analytics?.definitions && typeof analytics.definitions === "object" && !Array.isArray(analytics.definitions)
      ? (analytics.definitions as Record<string, unknown>)
      : {};

  if (!user || !["admin", "faculty", "student"].includes(user.role)) return null;

  return (
    <section className="mt-6" aria-labelledby="dashboard-summary-title">
      <h2
        id="dashboard-summary-title"
        className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100"
      >
        Overview
      </h2>

      <div className="mt-3">
        <FormError message={error} />
        {loading || (needsTerm && termLoading) ? (
          <div role="status" aria-label="Loading dashboard analytics" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : needsTerm && (syId == null || semId == null) ? (
          <EmptyState title="Select an academic term">
            Choose a school year and semester in the navigation bar to load this dashboard.
          </EmptyState>
        ) : !error && summary.length === 0 ? (
          <EmptyState title="No analytics available">
            The backend returned no summary figures for this selection.
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.map(([key, value]) => (
              <Card key={key} className="p-4">
                <p className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {labelFor(key)}
                </p>
                <p className="mt-2 font-display text-3xl tracking-wide text-navy-700 dark:text-mist-100">
                  {displayValue(value)}
                </p>
                {typeof definitions[key] === "string" && (
                  <p className="mt-2 font-body text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {definitions[key] as string}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
