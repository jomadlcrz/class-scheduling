export type LabSlot = {
  start: string;
  end: string;
};

export type WeeklyHourAllocation = {
  /** Backend SubjectTypeName value, e.g. "GenEd". */
  subjectType: string;
  subjectTypeLabel: string;
  lectureHours: number;
  labHours: number;
  meetings: number;
  labTimeSlots: LabSlot[];
  totalWeeklyHours: number;
  meetingsPerWeek: number | null;
  hoursPerMeeting: number | null;
  schedulePattern: string | null;
  meetingsNote: string | null;
};

export type CreateWeeklyHourAllocationInput = {
  subjectType: string;
  lectureHours: number;
  labHours: number;
  meetings: number;
  labTimeSlots?: LabSlot[];
};
