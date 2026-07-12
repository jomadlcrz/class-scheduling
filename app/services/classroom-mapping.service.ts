import { ApiError, apiGet } from "~/lib/api";
import { normalizeTime } from "~/lib/time";
import type {
  Classroom,
  ClassEntry,
  ClassroomStatus,
  DayOfWeek,
  SubjectType,
} from "~/features/classroom-mapping/mapping-model";
import { DAYS } from "~/features/classroom-mapping/mapping-model";

/**
 * Classroom mapping: rooms from the facilities module joined with the
 * global schedule view (GET /schedule/view) by room name.
 */

type RoomsResponse = {
  buildings: {
    building_id: number;
    building_name: string;
    rooms: {
      room_id: number;
      room_name: string;
      room_status: string;
    }[];
  }[];
};

type ScheduleEntry = {
  school_year: string;
  semester: string;
  subject_type: string;
  subject_code: string;
  desc_title: string;
  set_name: string;
  day_of_week: string;
  /** "07:00 AM - 08:30 AM" */
  class_time: string;
  faculty_name: string;
  room_name: string | null;
};

/** The backend answers an empty schedule table with a bare []. */
type ScheduleViewResponse = { schedules: ScheduleEntry[] } | unknown[];

function toSubjectType(raw: string | null | undefined): SubjectType {
  switch ((raw ?? "").trim().toLowerCase()) {
    case "major with lab":
      return "major_lab";
    case "gened":
      return "gen_ed";
    default:
      return "major_no_lab";
  }
}

function toStatus(roomStatus: string): ClassroomStatus {
  return roomStatus === "Vacant" ? "available" : "full";
}

type MappingFilters = {
  schoolYear?: string;
  semester?: string;
  /** semester_number from GET /semesters — matched against the ordinal in the view's label. */
  semesterNumber?: number;
};

/** "1st Semester" → 1; NaN when the label has no leading ordinal. */
function semesterOrdinal(label: string | null | undefined): number {
  return Number.parseInt(label ?? "", 10);
}

type MappingResult = {
  classrooms: Classroom[];
};

async function list(filters?: MappingFilters): Promise<MappingResult> {
  const roomsPromise = apiGet<RoomsResponse>("/rooms").catch((err) => {
    if (err instanceof ApiError && err.status === 404) {
      return { buildings: [] } satisfies RoomsResponse;
    }
    throw err;
  });
  const [roomsData, scheduleData] = await Promise.all([
    roomsPromise,
    apiGet<ScheduleViewResponse>("/schedule/view"),
  ]);

  const schedules = Array.isArray(scheduleData) ? [] : scheduleData.schedules ?? [];

  const wantedSemester = filters?.semester?.trim().toLowerCase();
  const wantedOrdinal = filters?.semesterNumber ?? semesterOrdinal(filters?.semester);
  const matchesSemester = (label: string) =>
    label?.trim().toLowerCase() === wantedSemester ||
    (Number.isFinite(wantedOrdinal) && semesterOrdinal(label) === wantedOrdinal);

  const roomScheduleMap = new Map<string, ClassEntry[]>();
  for (const schedule of schedules) {
    if (filters?.schoolYear && schedule.school_year !== filters.schoolYear) continue;
    if ((wantedSemester || filters?.semesterNumber) && !matchesSemester(schedule.semester)) continue;
    if (!schedule.room_name) continue;

    const day = DAYS.find((d) => d === schedule.day_of_week) as DayOfWeek | undefined;
    if (!day) continue;

    const [startTime = "", endTime = ""] = schedule.class_time.split(" - ");
    const entry: ClassEntry = {
      day,
      startTime: normalizeTime(startTime.trim()),
      endTime: normalizeTime(endTime.trim()),
      subjectCode: schedule.subject_code,
      descriptiveTitle: schedule.desc_title,
      instructor: schedule.faculty_name,
      section: schedule.set_name,
      type: toSubjectType(schedule.subject_type),
    };

    const existing = roomScheduleMap.get(schedule.room_name) ?? [];
    existing.push(entry);
    roomScheduleMap.set(schedule.room_name, existing);
  }

  return {
    classrooms: roomsData.buildings.flatMap((building) =>
      building.rooms.map((room) => ({
        id: String(room.room_id),
        name: room.room_name,
        buildingId: String(building.building_id),
        status: toStatus(room.room_status),
        entries: roomScheduleMap.get(room.room_name) ?? [],
      })),
    ),
  };
}

export const classroomMappingService = { list };
