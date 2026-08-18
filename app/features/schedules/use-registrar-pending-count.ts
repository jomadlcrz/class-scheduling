import { useEffect, useState } from "react";
import { useAuth } from "~/hooks/use-auth";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import { setService } from "~/services/set.service";

/**
 * Matches the "Needs your attention" count from HubActionQueue:
 * drafts + rejected + in-review releases + unscheduled sections.
 * Returns 0 for non-registrars and makes no request for them.
 */
export function useRegistrarPendingScheduleCount(): number {
  const { user } = useAuth();
  const isRegistrar = user?.role === "registrar";
  const { schoolYears, defaultSchoolYear } = useSchoolYears();
  const { semesters } = useSemesters();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isRegistrar) {
      setCount(0);
      return;
    }
    const schoolYear = schoolYears.find((s) => s.schoolYear === defaultSchoolYear) ?? schoolYears[0];
    const semester = semesters.find((s) => s.semesterNumber !== 3) ?? semesters[0];
    if (!schoolYear || !semester) return;

    let cancelled = false;
    Promise.all([
      scheduleReleaseService.listReleases(schoolYear.id, semester.semesterNumber),
      setService.listUnscheduled({ syId: schoolYear.id, semesterNumber: semester.semesterNumber }),
    ])
      .then(([releases, unscheduled]) => {
        if (cancelled) return;
        const releaseCount = releases.filter(
          (r) => r.releaseStatus !== "approved",
        ).length;
        setCount(releaseCount + unscheduled.length);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [isRegistrar, schoolYears, defaultSchoolYear, semesters]);

  return isRegistrar ? count : 0;
}
