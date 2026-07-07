import type { SubjectType } from "~/types/subject";
import { weeklyHourAllocations } from "~/services/mock-data";

export function getHoursForSubjectType(subjectType: SubjectType): { lectureHours: number; labHours: number } {
  const allocation = weeklyHourAllocations.find((a) => a.subjectType === subjectType);
  if (allocation) {
    return { lectureHours: allocation.lectureHours, labHours: allocation.labHours };
  }
  const defaults: Record<SubjectType, { lectureHours: number; labHours: number }> = {
    gened: { lectureHours: 3, labHours: 0 },
    "major-lab": { lectureHours: 2, labHours: 3 },
    major: { lectureHours: 3, labHours: 0 },
    minor: { lectureHours: 2, labHours: 0 },
  };
  return defaults[subjectType];
}
