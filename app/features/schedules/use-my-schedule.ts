import { useEffect, useMemo, useState } from "react";
import { useCachedData } from "~/hooks/use-cached-data";
import { scheduleService } from "~/services/schedule.service";
import { DAYS, type ScheduleSemester } from "~/types/schedule";

/**
 * Loads the caller's own schedule (student or faculty — the backend scopes rows via
 * the JWT) and defaults the term filter to the latest school year and its first
 * semester. Both /student-schedule and /faculty-schedule are otherwise identical
 * consumers of this data.
 */
export function useMySchedule() {
  const { data: schedules, error: loadError } = useCachedData("my-schedule", () =>
    scheduleService.view(),
  );

  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState<ScheduleSemester>(1);

  // Default the term filter to the latest school year and its first semester once loaded.
  useEffect(() => {
    if (!schedules || schedules.length === 0 || schoolYear) return;
    const years = [...new Set(schedules.map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a));
    const firstYear = years[0] ?? "";
    if (firstYear) setSchoolYear(firstYear);
    const firstSemester = schedules.find((s) => s.schoolYear === firstYear)?.semester;
    if (firstSemester) setSemester(firstSemester);
  }, [schedules, schoolYear]);

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
