import { DAY_LABELS, formatTime, SCHEDULE_SEMESTER_LABELS } from "~/types/schedule";
import type { Classroom, ClassEntry, ClassroomStatus, DayOfWeek, SubjectType } from "~/features/classroom-mapping/mapping-model";

function toSubjectType(raw: string | null | undefined): SubjectType {
  switch ((raw ?? "").trim().toLowerCase()) {
    case "major-lab": return "major_lab";
    case "gened": return "gen_ed";
    default: return "major_no_lab";
  }
}

function toStatus(roomStatus: string): ClassroomStatus {
  return roomStatus === "vacant" ? "available" : "full";
}

function toDayOfWeek(dayCode: string): DayOfWeek | null {
  const full = DAY_LABELS[dayCode as keyof typeof DAY_LABELS];
  return full ? (full as DayOfWeek) : null;
}

type MappingFilters = {
  schoolYear?: string;
  semester?: string;
};

type MappingResult = {
  classrooms: Classroom[];
  schoolYears: string[];
};

async function list(filters?: MappingFilters): Promise<MappingResult> {
  await delay(400);

  const filtered = schedules.filter((s) => {
    if (filters?.schoolYear && s.schoolYear !== filters.schoolYear) return false;
    if (filters?.semester) {
      const semesterLabel = SCHEDULE_SEMESTER_LABELS[s.semester];
      if (semesterLabel !== filters.semester) return false;
    }
    return true;
  });

  const subjectMap = new Map(subjects.map((s) => [s.id, s.subjectType]));

  const roomScheduleMap = new Map<string, ClassEntry[]>();

  for (const schedule of filtered) {
    const day = toDayOfWeek(schedule.day);
    if (!day) continue;

    const subjectType = toSubjectType(subjectMap.get(schedule.subjectId) ?? null);

    const entry: ClassEntry = {
      day,
      startTime: formatTime(schedule.startTime),
      endTime: formatTime(schedule.endTime),
      subjectCode: schedule.subjectCode,
      descriptiveTitle: schedule.subjectTitle,
      instructor: schedule.facultyName,
      section: schedule.setCode,
      type: subjectType,
    };

    const existing = roomScheduleMap.get(schedule.roomId) ?? [];
    existing.push(entry);
    roomScheduleMap.set(schedule.roomId, existing);
  }

  const schoolYears = [...new Set(schedules.map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a));

  return {
    classrooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      buildingId: room.buildingId,
      status: toStatus(room.status),
      entries: roomScheduleMap.get(room.id) ?? [],
    })),
    schoolYears,
  };
}

export const classroomMappingService = { list };
