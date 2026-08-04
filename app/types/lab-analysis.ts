/** Laboratory capacity board — GET /schedule/laboratory-analysis response, camelCased. */

export type LabSlotTemplateEntry = {
  slot: string;
  startTime: string;
  endTime: string;
  hours: number;
};

export type LabSession = {
  regularSchedId: number;
  day: string;
  startTime: string;
  endTime: string;
  hours: number;
  subjectId: number | null;
  subjectCode: string | null;
  descriptiveTitle: string | null;
  subjectType: string | null;
  programId: number | null;
  programAbbrev: string | null;
  setId: number | null;
  setCode: string | null;
  yearLevel: number | null;
  instructorId: number | null;
  instructor: string | null;
  mode: string | null;
};

export type LabSlotRow = LabSlotTemplateEntry & {
  status: "occupied" | "free";
  occupiedBy: LabSession[];
};

export type LabFreeWindow = {
  startTime: string;
  endTime: string;
  hours: number;
};

export type LabConflict = {
  day: string;
  overlap: string;
  sessions: number[];
  detail: string;
};

export type LabDay = {
  day: string;
  dayIndex: number;
  sessions: number;
  bookedHours: number;
  freeHours: number;
  hourUtilizationPercent: number;
  slotsUsed: number;
  slotsFree: number;
  slots: LabSlotRow[];
  freeWindows: LabFreeWindow[];
  sessionList: LabSession[];
};

type LabProgramAccessEntry = {
  programId: number;
  programAbbrev: string | null;
  programName: string | null;
};

type LabRoomAccess = {
  isRestricted: boolean;
  programs: LabProgramAccessEntry[];
  note: string;
};

type LabRoomUsage = {
  sessions: number;
  bookedHours: number;
  windowCapacityHours: number;
  freeHours: number;
  hourUtilizationPercent: number;
  slotCapacity: number;
  slotsUsed: number;
  slotsFree: number;
  slotUtilizationPercent: number;
  isFullyBooked: boolean;
  largestFreeBlockHours: number;
  distinctPrograms: number;
  distinctSubjects: number;
  distinctSets: number;
};

type LabRoomProgramUsage = {
  programId: number | null;
  programAbbrev: string | null;
  sessions: number;
  bookedHours: number;
  sharePercent: number;
  sets: string[];
};

export type LabFreeSlot = LabSlotTemplateEntry & {
  day: string;
  dayIndex: number;
};

export type LabRoom = {
  roomId: number;
  roomName: string;
  roomCapacity: number;
  roomStatus: string | null;
  floorLevel: number | null;
  buildingId: number | null;
  building: string | null;
  access: LabRoomAccess;
  usage: LabRoomUsage;
  byProgram: LabRoomProgramUsage[];
  byDay: LabDay[];
  freeSlots: LabFreeSlot[];
  unslottedSessions: LabSession[];
  conflicts: LabConflict[];
};

export type LabAnalysisTotals = {
  laboratories: number;
  slotsPerDay: number;
  days: number;
  sessions: number;
  bookedHours: number;
  windowCapacityHours: number;
  freeHours: number;
  hourUtilizationPercent: number;
  slotCapacity: number;
  slotsUsed: number;
  slotsFree: number;
  slotUtilizationPercent: number;
  fullyBookedLaboratories: number;
  laboratoriesWithFreeSlots: number;
  conflicts: number;
  unslottedSessions: number;
};

type LabProgramAccessRoom = {
  roomId: number;
  roomName: string;
  slotsFree: number;
  slotUtilizationPercent: number;
  isFullyBooked: boolean;
  largestFreeBlockHours: number;
  ownSessions: number;
  ownBookedHours: number;
};

export type LabProgramAccessRow = LabProgramAccessEntry & {
  laboratories: LabProgramAccessRoom[];
  slotCapacity: number;
  slotsFree: number;
  ownSessions: number;
  ownHours: number;
  freeSlots: LabFreeSlot[];
  canScheduleALabClass: boolean;
  summary: string;
};

export type LabAnalysis = {
  term: {
    syId: number;
    schoolYear: string;
    semesterNumber: number;
  };
  window: {
    days: string[];
    dayStart: string;
    dayEnd: string;
    hoursPerDay: number;
    note: string;
  };
  slotTemplate: LabSlotTemplateEntry[];
  totals: LabAnalysisTotals;
  laboratories: LabRoom[];
  programAccess: LabProgramAccessRow[];
};
