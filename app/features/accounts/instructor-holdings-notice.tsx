import { useEffect, useState } from "react";
import { AlertTriangleIcon } from "~/components/ui/icons";
import { InstructorHoldingsSummary } from "~/features/schedules/instructor-holdings-summary";
import { publishedAmendmentsService } from "~/services/published-amendments.service";
import type { InstructorHoldings } from "~/types/published-amendments";

/**
 * What this instructor is still teaching, shown before their account is closed.
 *
 * Deactivating a faculty account deactivates the LOGIN and nothing else — by
 * design, per the never-delete-accounts rule. It does not touch the timetable,
 * the load ledgers or their subject assignments.
 */
export function InstructorHoldingsNotice({
  instructorProfileId,
  open,
}: {
  /** null when the account has no instructor profile — nothing to warn about. */
  instructorProfileId: number | null;
  open: boolean;
}) {
  const [holdings, setHoldings] = useState<InstructorHoldings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || instructorProfileId == null) {
      setHoldings(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    publishedAmendmentsService
      .getHoldings(instructorProfileId)
      .then((result) => {
        if (!cancelled) setHoldings(result);
      })
      .catch(() => {
        if (!cancelled) setHoldings(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, instructorProfileId]);

  if (loading) {
    return (
      <p className="font-body text-xs text-slate-500 dark:text-slate-400">
        Checking what they are still teaching…
      </p>
    );
  }
  if (!holdings || holdings.meetingCount === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-gold-400/25 dark:bg-gold-400/[0.06]">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-amber-600 dark:text-gold-300" aria-hidden="true">
          <AlertTriangleIcon />
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold tracking-wide text-amber-800 dark:text-gold-300">
            Still on the timetable
          </p>
          <p className="mt-1 font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Closing this account does not change any schedule.{" "}
            <span className="font-medium text-navy-700 dark:text-mist-100">
              {holdings.instructorName}
            </span>{" "}
            will keep appearing on every class below, and their hours will keep
            counting against their load.
          </p>
          <InstructorHoldingsSummary holdings={holdings} />
          <p className="mt-2 font-body text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            To hand these over, the Registrar opens any of these classes in Master
            Schedules and uses Amend published class → Instructor left. Every class
            becomes TBA until a replacement assigned to the subject takes it — the
            Dean assigns Major subjects, the Registrar assigns GenEd and minor
            subjects.
          </p>
        </div>
      </div>
    </div>
  );
}
