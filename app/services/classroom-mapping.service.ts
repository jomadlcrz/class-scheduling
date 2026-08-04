import { apiGet } from "~/lib/api";
import { normalizeTime } from "~/lib/time";
import type {
  Classroom,
  ClassEntry,
  DayOfWeek,
  SubjectType,
} from "~/features/classroom-mapping/mapping-model";
import { DAYS, SUBJECT_TYPES } from "~/features/classroom-mapping/mapping-model";

type MappingDayEntry = {
  day: string;
  start_time: string;
  end_time: string;
  subject_type: string;
  subject_code: string;
  subject_title: string;
  instructor: string;
  set_name: string;
};

type MappingRoom = {
  room_name: string;
  days: MappingDayEntry[];
};

type MappingFilters = {
  schoolYear?: string;
  semesterNumber?: number;
  building?: string;
};

type MappingResult = {
  classrooms: Classroom[];
};

function toSubjectType(raw: string | null | undefined): SubjectType {
  const value = (raw ?? "").trim();
  return SUBJECT_TYPES.includes(value as SubjectType) ? (value as SubjectType) : "Major without Lab";
}

async function list(filters?: MappingFilters): Promise<MappingResult> {
  const params = new URLSearchParams();
  if (filters?.schoolYear) params.set("school_year", filters.schoolYear);
  if (filters?.semesterNumber != null) params.set("semester_number", String(filters.semesterNumber));
  if (filters?.building) params.set("building", filters.building);

  const query = params.toString();
  const rooms = await apiGet<MappingRoom[]>(
    `/room_mapping/get-room-mapped${query ? `?${query}` : ""}`,
  );

  const classrooms: Classroom[] = rooms.map((room) => {
    const entries: ClassEntry[] = room.days
      .filter((d) => DAYS.includes(d.day as DayOfWeek))
      .map((d) => ({
        day: d.day as DayOfWeek,
        startTime: normalizeTime(d.start_time),
        endTime: normalizeTime(d.end_time),
        subjectCode: d.subject_code,
        descriptiveTitle: d.subject_title,
        instructor: d.instructor,
        section: d.set_name,
        type: toSubjectType(d.subject_type),
      }));

    return {
      id: room.room_name,
      name: room.room_name,
      entries,
    };
  });

  return { classrooms };
}

export const classroomMappingService = { list };
