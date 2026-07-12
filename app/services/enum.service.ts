import { apiGet } from "~/lib/api";

/**
 * Backend enum values (app/enums.py), fetched instead of duplicated in the
 * frontend — a pure pass-through of the options endpoint.
 */

export type DayOfWeekOption = {
  id: number;
  name: string;
};

export type YearLevelOption = {
  id: number;
  name: string;
};

export type EnumOptions = {
  classMode: string[];
  gender: string[];
  civilStatus: string[];
  classroomStatus: string[];
  roleName: string[];
  studentType: string[];
  academicStatus: string[];
  personnelType: string[];
  roomType: string[];
  subjectType: string[];
  dayOfWeek: DayOfWeekOption[];
  yearLevels: YearLevelOption[];
};

type EnumOptionsResponse = {
  class_mode: string[];
  gender: string[];
  civil_status: string[];
  classroom_status: string[];
  role_name: string[];
  student_type: string[];
  academic_status: string[];
  personnel_type: string[];
  room_type: string[];
  subject_type: string[];
  day_of_week: DayOfWeekOption[];
  year_level: string[];
};

// Static per deploy, so one fetch serves the whole session.
let cached: Promise<EnumOptions> | null = null;

function getOptions(): Promise<EnumOptions> {
  cached ??= apiGet<EnumOptionsResponse>("/enums")
    .then((data) => ({
      classMode: data.class_mode,
      gender: data.gender,
      civilStatus: data.civil_status,
      classroomStatus: data.classroom_status,
      roleName: data.role_name,
      studentType: data.student_type,
      academicStatus: data.academic_status,
      personnelType: data.personnel_type,
      roomType: data.room_type,
      subjectType: data.subject_type,
      dayOfWeek: data.day_of_week,
      // Backend sends ordered YearLevelEnum labels; the level number is the position.
      yearLevels: data.year_level.map((name, i) => ({ id: i + 1, name })),
    }))
    .catch((err) => {
      cached = null; // allow a retry on the next call
      throw err;
    });
  return cached;
}

export const enumService = {
  getOptions,
};
