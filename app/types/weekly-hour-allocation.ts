import type { SubjectType } from "~/types/subject";

export type LabSlot = {
  start: string;
  end: string;
};

export type WeeklyHourAllocation = {
  subjectType: SubjectType;
  subjectTypeLabel: string;
  lectureHours: number;
  labHours: number;
  meetings: number;
  labTimeSlots: LabSlot[];
};

export type CreateWeeklyHourAllocationInput = {
  subjectType: SubjectType;
  lectureHours: number;
  labHours: number;
  meetings: number;
  labTimeSlots?: LabSlot[];
};
