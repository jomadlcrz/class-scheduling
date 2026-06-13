import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from "../types/schedule";
import { schedules, delay, newScheduleId } from "./mock-data";

function findSchedule(id: string): Schedule {
  const s = schedules.find((s) => s.id === id);
  if (!s) throw new Error("Schedule not found.");
  return s;
}

function timeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function checkConflicts(input: CreateScheduleInput, excludeId?: string): void {
  const relevant = schedules.filter(
    (s) =>
      s.id !== excludeId &&
      s.schoolYear === input.schoolYear &&
      s.semester === input.semester &&
      s.day === input.day &&
      timeOverlaps(input.startTime, input.endTime, s.startTime, s.endTime),
  );

  const facultyConflict = relevant.find((s) => s.facultyId === input.facultyId);
  if (facultyConflict) {
    throw new Error(
      `${input.facultyName} is already scheduled on this day at this time (${facultyConflict.subjectCode} — ${facultyConflict.setCode}).`,
    );
  }

  const roomConflict = relevant.find((s) => s.roomId === input.roomId);
  if (roomConflict) {
    throw new Error(
      `${input.roomName} is already occupied at this time (${roomConflict.subjectCode} — ${roomConflict.setCode}).`,
    );
  }

  const setConflict = relevant.find((s) => s.setId === input.setId);
  if (setConflict) {
    throw new Error(
      `Set ${input.program} ${input.setCode} already has a class at this time (${setConflict.subjectCode}).`,
    );
  }
}

async function list(): Promise<Schedule[]> {
  await delay();
  return [...schedules];
}

async function create(input: CreateScheduleInput): Promise<Schedule> {
  await delay(300);
  if (input.startTime >= input.endTime)
    throw new Error("End time must be after start time.");
  checkConflicts(input);
  const schedule: Schedule = { id: newScheduleId(), ...input };
  schedules.push(schedule);
  return schedule;
}

async function update(id: string, input: UpdateScheduleInput): Promise<Schedule> {
  await delay();
  const schedule = findSchedule(id);
  const merged = { ...schedule, ...input } as CreateScheduleInput;
  if (merged.startTime >= merged.endTime)
    throw new Error("End time must be after start time.");
  checkConflicts(merged, id);
  Object.assign(schedule, input);
  return schedule;
}

async function remove(id: string): Promise<void> {
  await delay();
  const schedule = findSchedule(id);
  schedules.splice(schedules.indexOf(schedule), 1);
}

export const scheduleService = { list, create, update, remove };
