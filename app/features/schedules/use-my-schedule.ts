import { useEffect, useMemo, useState } from "react";
import { scheduleService } from "~/services/schedule.service";
import { DAYS, type Schedule, type ScheduleSemester } from "~/types/schedule";

/**
 * Loads the caller's own schedule (student or faculty — the backend scopes rows via
 * the JWT) and defaults the term filter to the latest school year and its first
 * semester. Both /student-schedule and /faculty-schedule are otherwise identical
 * consumers of this data.
 */
export function useMySchedule() {
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState<ScheduleSemester>(1);

  useEffect(() => {
    scheduleService
      .view()
      .then((result) => {
        setSchedules(result);
        const years = [...new Set(result.map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a));
        const firstYear = years[0] ?? "";
        setSchoolYear(firstYear);
        const firstSemester = result.find((s) => s.schoolYear === firstYear)?.semester;
        if (firstSemester) setSemester(firstSemester);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load your schedule.");
        setSchedules([]);
      });
  }, []);

  const schoolYears = useMemo(
    () => [...new Set((schedules ?? []).map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a)),
    [schedules],
  );

  const visibleSchedules = useMemo(() => {
    if (!schedules) return [];
    return schedules
      .filter((s) => s.schoolYear === schoolYear && s.semester === semester)
      .sort(
        (a, b) =>
          DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
      );
  }, [schedules, schoolYear, semester]);

  return {
    isLoading: schedules === null,
    loadError,
    schoolYear,
    setSchoolYear,
    semester,
    setSemester,
    schoolYears,
    visibleSchedules,
  };
}
