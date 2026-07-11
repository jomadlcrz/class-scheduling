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
};

export type CreateWeeklyHourAllocationInput = {
  subjectType: string;
  lectureHours: number;
  labHours: number;
  meetings: number;
  labTimeSlots?: LabSlot[];
};
