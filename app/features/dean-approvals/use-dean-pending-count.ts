import { useEffect, useState } from "react";
import { useAuth } from "~/hooks/use-auth";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { scheduleReleaseService } from "~/services/schedule-release.service";

/**
 * Pending schedule-approval count for the dean's current term, for the nav badge.
 * Returns 0 for non-deans and makes no request for them. Resolves the term the
 * same way `useDeanScheduleApprovals` does (default school year + first non-3 semester).
 */
export function useDeanPendingApprovalsCount(): number {
  const { user } = useAuth();
  const isDean = user?.role === "dean";
  const { schoolYears, defaultSchoolYear } = useSchoolYears();
  const { semesters } = useSemesters();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isDean) {
      setCount(0);
      return;
    }
    const schoolYear = schoolYears.find((s) => s.schoolYear === defaultSchoolYear) ?? schoolYears[0];
    const semester = semesters.find((s) => s.semesterNumber !== 3) ?? semesters[0];
    if (!schoolYear || !semester) return;

    let cancelled = false;
    scheduleReleaseService
      .listApprovals(schoolYear.id, semester.semesterNumber)
      .then((inbox) => {
        if (!cancelled) setCount(inbox.pending.length);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [isDean, schoolYears, defaultSchoolYear, semesters]);

  return isDean ? count : 0;
}
