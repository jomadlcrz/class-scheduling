import type { WeeklyHourAllocation, CreateWeeklyHourAllocationInput } from "~/types/weekly-hour-allocation";

async function getSubjectTypeOptions(): Promise<string[]> {
  await delay(300);
  return [...subjectTypeOptions];
}

async function list(): Promise<WeeklyHourAllocation[]> {
  await delay(300);
  return [...weeklyHourAllocations];
}

function findIndex(subjectType: string): number {
  return weeklyHourAllocations.findIndex((a) => a.subjectType === subjectType);
}

async function create(input: CreateWeeklyHourAllocationInput): Promise<WeeklyHourAllocation> {
  await delay(300);
  const existing = findIndex(input.subjectType);
  const allocation: WeeklyHourAllocation = {
    subjectType: input.subjectType,
    subjectTypeLabel: input.subjectType,
    lectureHours: input.lectureHours,
    labHours: input.labHours,
    meetings: input.meetings,
    labTimeSlots: input.labTimeSlots ?? [],
  };
  if (existing >= 0) {
    weeklyHourAllocations[existing] = allocation;
  } else {
    weeklyHourAllocations.push(allocation);
  }
  return allocation;
}

export const weeklyHourService = { getSubjectTypeOptions, list, create };
