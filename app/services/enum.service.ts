import { apiGet } from "~/lib/api";

/**
 * Backend enum values (app/enums.py), fetched instead of duplicated in the
 * frontend — a pure pass-through of the options endpoint (GET /enums).
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
  academicStatus: string[];
  civilStatus: string[];
  classMode: string[];
  classroomStatus: string[];
  dayOfWeek: DayOfWeekOption[];
  degreeType: string[];
  departmentType: string[];
  enrollmentState: string[];
  gender: string[];
  nameSuffix: string[];
  personnelType: string[];
  roleName: string[];
  roomType: string[];
  sessionMode: string[];
  studentType: string[];
  subjectType: string[];
  termStatus: string[];
  yearLevel: string[];
  yearLevels: YearLevelOption[];
};

type EnumOptionsResponse = {
  academic_status: string[];
  civil_status: string[];
  class_mode: string[];
  classroom_status: string[];
  day_of_week: DayOfWeekOption[];
  degree_type: string[];
  department_type: string[];
  enrollment_state: string[];
  gender: string[];
  name_suffix: string[];
  personnel_type: string[];
  role_name: string[] | string;
  room_type: string[];
  session_mode: string[];
  student_type: string[];
  subject_type: string[];
  term_status: string[];
  year_level: string[];
};

// Static per deploy, so one fetch serves the whole session.
let cached: Promise<EnumOptions> | null = null;

function getOptions(): Promise<EnumOptions> {
  cached ??= apiGet<EnumOptionsResponse>("/enums")
    .then((data) => {
      const roleName = Array.isArray(data.role_name)
        ? data.role_name
        : typeof data.role_name === "string"
          ? (JSON.parse(data.role_name) as string[])
          : [];

      return {
        academicStatus: data.academic_status ?? [],
        civilStatus: data.civil_status ?? [],
        classMode: data.class_mode ?? [],
        classroomStatus: data.classroom_status ?? [],
        dayOfWeek: data.day_of_week ?? [],
        degreeType: data.degree_type ?? [],
        departmentType: data.department_type ?? [],
        enrollmentState: data.enrollment_state ?? [],
        gender: data.gender ?? [],
        nameSuffix: data.name_suffix ?? [],
        personnelType: data.personnel_type ?? [],
        roleName,
        roomType: data.room_type ?? [],
        sessionMode: data.session_mode ?? [],
        studentType: data.student_type ?? [],
        subjectType: data.subject_type ?? [],
        termStatus: data.term_status ?? [],
        yearLevel: data.year_level ?? [],
        yearLevels: (data.year_level ?? []).map((name, i) => ({ id: i + 1, name })),
      };
    })
    .catch((err) => {
      cached = null; // allow a retry on the next call
      throw err;
    });
  return cached;
}

export const enumService = {
  getOptions,
};
