import type { WeeklyHourAllocation } from "~/types/weekly-hour-allocation";

export function getHoursForSubjectType(
  subjectType: string,
  allocations: WeeklyHourAllocation[] = [],
): { lectureHours: number; labHours: number } {
  const allocation = allocations.find((a) => a.subjectType === subjectType);
  if (allocation) {
    return { lectureHours: allocation.lectureHours, labHours: allocation.labHours };
  }
  // Backend SubjectTypeName values.
  const defaults: Record<string, { lectureHours: number; labHours: number }> = {
    GenEd: { lectureHours: 3, labHours: 0 },
    "Major with Lab": { lectureHours: 2, labHours: 3 },
    "Major without Lab": { lectureHours: 3, labHours: 0 },
  };
  return defaults[subjectType] ?? { lectureHours: 3, labHours: 0 };
}
