import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { FormError } from "~/components/forms/form-error";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { selfAnalyticsService } from "~/services/self-analytics.service";
import type {
  StudentProfileWithoutLogin,
  SuperAdminAccount,
  SuperAdminAnalytics,
} from "~/types/super-admin-analytics";
import {
  ChartCard,
  LoginStatusDonut,
  PermissionsDonut,
  RoleAccountsDonut,
  StatTile,
  superAdminRoleLabel,
} from "~/features/dashboard/dashboard-charts";
import {
  LoadingSkeleton,
  fadeSlideUp,
  popCard,
  staggerSections,
  staggerWidgets,
} from "~/features/dashboard/dashboard-shared";

const ROLE_BADGE_TONES: Record<string, BadgeTone> = {
  SUPER_ADMIN: "gold",
  REGISTRAR_ADMIN: "navy",
  DEAN: "violet",
  INSTRUCTOR: "sky",
  STUDENT: "emerald",
};

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

function PendingFirstLoginTable({ accounts }: { accounts: SuperAdminAccount[] }) {
  if (accounts.length === 0) {
    return (
      <motion.div
        variants={popCard}
        className="flex h-44 items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500"
      >
        Every account has signed in at least once.
      </motion.div>
    );
  }
  const shown = accounts.slice(0, 12);
  const overflow = accounts.length - shown.length;
  return (
    <motion.div variants={popCard}>
      <Table>
        <TableHead>
          <TableHeader>Email</TableHeader>
          <TableHeader>Roles</TableHeader>
        </TableHead>
        <TableBody>
          {shown.map((account) => (
            <TableRow key={account.user_id}>
              <TableCell>
                <a href={`mailto:${account.email}`} className="font-medium text-slate-800 hover:underline dark:text-slate-200">
                  {account.email}
                </a>
              </TableCell>
              <TableCell>
                <span className="flex flex-wrap gap-1">
                  {account.roles.map((role) => (
                    <Badge key={role} tone={ROLE_BADGE_TONES[role] ?? "slate"}>
                      {superAdminRoleLabel(role)}
                    </Badge>
                  ))}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {overflow > 0 && (
        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          +{overflow} more pending accounts.
        </p>
      )}
    </motion.div>
  );
}

function StudentsWithoutLoginTable({ students }: { students: StudentProfileWithoutLogin[] }) {
  if (students.length === 0) {
    return (
      <motion.div
        variants={popCard}
        className="flex h-44 items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500"
      >
        Every student profile has a login account.
      </motion.div>
    );
  }
  const shown = students.slice(0, 12);
  const overflow = students.length - shown.length;
  return (
    <motion.div variants={popCard}>
      <Table>
        <TableHead>
          <TableHeader>Student</TableHeader>
          <TableHeader>Student ID</TableHeader>
        </TableHead>
        <TableBody>
          {shown.map((student) => (
            <TableRow key={student.student_profile_id}>
              <TableCell>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {student.full_name}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {student.student_id ?? "—"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {overflow > 0 && (
        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          +{overflow} more profiles without a login.
        </p>
      )}
    </motion.div>
  );
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
  const pendingAccounts =
    analytics?.accounts.active.filter((a) => a.pending_first_login) ?? [];

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
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FormError message={error} />
          </motion.div>
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
                      subtitle="Active accounts per role across the whole system."
                    >
                      <RoleAccountsDonut roles={analytics.accounts_by_role} />
                    </ChartCard>
                  </div>
                  <ChartCard
                    title="Login status"
                    subtitle="Who has signed in at least once versus still pending."
                  >
                    <LoginStatusDonut counts={analytics.accounts.counts} />
                  </ChartCard>
                </motion.div>
              </motion.section>

              {/* ─── Permissions + students without login ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                >
                  <ChartCard
                    title="RBAC permissions"
                    subtitle={`${analytics.rbac.permissions_total} permission grants across ${analytics.rbac.roles} roles.`}
                  >
                    <PermissionsDonut rbac={analytics.rbac} />
                  </ChartCard>
                  <ChartCard
                    title="Students without login"
                    subtitle="Student profiles with no account yet — they can't sign in until one exists."
                  >
                    <StudentsWithoutLoginTable students={analytics.student_profiles_without_login} />
                  </ChartCard>
                </motion.div>
              </motion.section>

              {/* ─── Pending first login ─── */}
              <motion.section variants={fadeSlideUp}>
                <h3 className="mb-3 font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
                  Pending first login
                </h3>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                  Accounts that have never signed in — resend the temp password to get them
                  started.
                </p>
                <PendingFirstLoginTable accounts={pendingAccounts} />
              </motion.section>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
