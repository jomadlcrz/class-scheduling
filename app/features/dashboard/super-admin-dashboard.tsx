import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
import {
  ChartCard,
  LoginStatusDonut,
  PermissionsDonut,
  RoleAccountsDonut,
  StatTile,
} from "~/features/dashboard/dashboard-charts";
import {
  LoadingSkeleton,
  fadeSlideUp,
  staggerSections,
  staggerWidgets,
} from "~/features/dashboard/dashboard-shared";
import { selfAnalyticsService } from "~/services/self-analytics.service";
import type { SuperAdminAnalytics } from "~/types/super-admin-analytics";

type Tile = {
  title: string;
  displayValue: string;
  unit?: string;
  hint?: string;
  tone?: string;
  badge?: string;
  meterPercent?: number;
};

function pct(count: number, of: number): number {
  return of > 0 ? Math.round((count / of) * 100) : 0;
}

function buildTiles(data: SuperAdminAnalytics): Tile[] {
  const s = data.summary;
  const granted = s.permissions_total - s.permissions_ungranted;
  return [
    {
      title: "Active accounts",
      displayValue: String(s.accounts_active),
      unit: `of ${s.accounts_total} total`,
      tone: s.accounts_inactive > 0 ? "warning" : "good",
      badge: s.accounts_inactive > 0 ? `${s.accounts_inactive} deactivated` : "All active",
      meterPercent: pct(s.accounts_active, s.accounts_total),
    },
    {
      title: "Pending first login",
      displayValue: String(s.accounts_pending_first_login),
      unit: "created but never signed in",
      tone: s.accounts_pending_first_login > 0 ? "warning" : "good",
      badge: `${pct(s.accounts_pending_first_login, s.accounts_total)}% of accounts`,
      meterPercent: pct(s.accounts_pending_first_login, s.accounts_total),
    },
    {
      title: "Roles",
      displayValue: String(s.roles),
      unit: "in the RBAC system",
      tone: "neutral",
    },
    {
      title: "Permissions granted",
      displayValue: String(granted),
      unit: `of ${s.permissions_total} permission grants`,
      tone: s.permissions_ungranted > 0 ? "warning" : "good",
      badge: s.permissions_ungranted > 0 ? `${s.permissions_ungranted} ungranted` : "Complete",
      meterPercent: pct(granted, s.permissions_total),
    },
    {
      title: "Students without login",
      displayValue: String(s.student_profiles_without_login),
      unit: "student profiles need an account",
      tone: s.student_profiles_without_login > 0 ? "warning" : "good",
      badge: s.student_profiles_without_login > 0 ? "Needs action" : "None",
    },
    {
      title: "Deactivated accounts",
      displayValue: String(s.accounts_inactive),
      unit: "currently suspended",
      tone: s.accounts_inactive > 0 ? "critical" : "good",
      badge: s.accounts_inactive > 0 ? "Needs attention" : "None",
    },
  ];
}

/** The Super Admin's system-wide overview — a snapshot of every account and the
 * RBAC state, not scoped to any school term. */
export function SuperAdminDashboard() {
  const [analytics, setAnalytics] = useState<SuperAdminAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    selfAnalyticsService
      .getAdmin()
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
  }, []);

  const tiles = analytics ? buildTiles(analytics) : [];

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <LoadingSkeleton />
          </motion.div>
        ) : error ? (
          <DataLoadAlert title="Dashboard unavailable" message={error} permission={error.toLowerCase().includes("permission")} />
        ) : analytics ? (
          <motion.div
            key="data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              variants={staggerSections}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* ─── Header ─── */}
              <motion.div
                variants={fadeSlideUp}
                className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
                    Overview
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    System-wide account and RBAC snapshot — not tied to a school term.
                  </p>
                </div>
              </motion.div>

              {/* ─── Headline numbers ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {tiles.map((tile) => (
                    <StatTile key={tile.title} {...tile} />
                  ))}
                </motion.div>
              </motion.section>

              {/* ─── Accounts by role + login status ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 lg:grid-cols-3"
                >
                  <div className="lg:col-span-2">
                    <ChartCard
                      title="Accounts by role"
                    >
                      <RoleAccountsDonut roles={analytics.accounts_by_role} />
                    </ChartCard>
                  </div>
                  <ChartCard
                    title="Login status"
                  >
                    <LoginStatusDonut counts={analytics.accounts.counts} />
                  </ChartCard>
                </motion.div>
              </motion.section>

              {/* ─── Permissions ─── */}
              <motion.section variants={fadeSlideUp}>
                <ChartCard
                  title="RBAC permissions"
                >
                  <PermissionsDonut rbac={analytics.rbac} />
                </ChartCard>
              </motion.section>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
