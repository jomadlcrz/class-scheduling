import { timeToMinutes } from "~/lib/time";
import type {
  InstructorReviewDetail,
  InstructorReviewMeeting,
  ProposedMeeting,
} from "~/types/instructor-review";
import type { Room } from "~/types/room";

export const SLOT_STARTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30",
];

export type ProposalMeeting = {
  scheduleId: number;
  setId: number;
  subjectId: number;
  subjectCode: string;
  subjectTitle: string;
  subjectType: string | null;
  classMode: string;
  sessionMode: "LEC" | "LAB" | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: number | null;
  roomName: string | null;
  isProtected: boolean;
  setLabel: string;
  programAbbrev: string | null;
  movable: boolean;
  placed: boolean;
};

export type ProposalPlacementValidation = {
  valid: boolean;
  reason?: string;
};

export type ProposalChange = {
  original: ProposalMeeting;
  proposed: ProposalMeeting;
};

export function isMeetingChanged(original: ProposalMeeting, proposed: ProposalMeeting): boolean {
  return (
    original.dayOfWeek !== proposed.dayOfWeek ||
    original.startTime !== proposed.startTime ||
    original.endTime !== proposed.endTime ||
    original.roomId !== proposed.roomId ||
    original.classMode !== proposed.classMode
  );
}

export function validatePlacement(
  meetings: ProposalMeeting[],
  targetMeeting: ProposalMeeting,
  slot: { dayOfWeek: string; startTime: string; endTime: string },
): ProposalPlacementValidation {
  const targetStart = timeToMinutes(slot.startTime);
  const targetEnd = timeToMinutes(slot.endTime);

  if (targetEnd <= targetStart) {
    return { valid: false, reason: "End time must be after start time." };
  }

  for (const m of meetings) {
    if (m.scheduleId === targetMeeting.scheduleId) continue;
    if (!m.placed) continue;
    if (m.dayOfWeek.trim().toLowerCase() !== slot.dayOfWeek.trim().toLowerCase()) continue;

    const mStart = timeToMinutes(m.startTime);
    const mEnd = timeToMinutes(m.endTime);

    // Overlap condition
    if (targetStart < mEnd && targetEnd > mStart) {
      return {
        valid: false,
        reason: `Conflicts with ${m.subjectCode} (${m.startTime}–${m.endTime}).`,
      };
    }
  }

  return { valid: true };
}

export function roomAccessLabel(room: Room, programAbbrev: string | null): string | null {
  if (!room.programs || room.programs.length === 0) return "All programs";
  if (!programAbbrev) return null;
  const match = room.programs.some((p) => p.programAbbrev.toLowerCase() === programAbbrev.toLowerCase());
  return match ? "Designated for your program" : null;
}


export function snapshotOriginalMeetings(
  liveMeetings: ProposalMeeting[],
  proposedMeetings: ProposedMeeting[],
  rooms: Room[],
): ProposalMeeting[] {
  const roomById = new Map(rooms.map((r) => [r.id, r]));

  return liveMeetings.map((meeting) => {
    const proposed = proposedMeetings.find((p) => p.scheduleId === meeting.scheduleId);
    if (!proposed || !proposed.originalSlot) return meeting;

    const slot = proposed.originalSlot;
    const room = slot.roomId != null ? roomById.get(slot.roomId) ?? null : null;

    return {
      ...meeting,
      dayOfWeek: slot.dayOfWeek ?? meeting.dayOfWeek,
      startTime: slot.startTime ?? meeting.startTime,
      endTime: slot.endTime ?? meeting.endTime,
      roomId: slot.roomId !== undefined ? slot.roomId : meeting.roomId,
      roomName: room?.name ?? meeting.roomName,
    };
  });
}

export function distributedProposal(
  detail: InstructorReviewDetail,
  rooms: Room[],
  setLabel: string,
): ProposalMeeting[] {
  return detail.meetings.map((m: InstructorReviewMeeting) => ({
    scheduleId: m.scheduleId,
    setId: detail.setId,
    subjectId: m.subjectId,
    subjectCode: m.subjectCode ?? "",
    subjectTitle: m.subjectTitle ?? "",
    subjectType: m.subjectType ?? null,
    classMode: m.classMode,
    sessionMode: m.sessionMode ?? null,
    dayOfWeek: m.dayOfWeek,
    startTime: m.startTime,
    endTime: m.endTime,
    roomId: m.roomId,
    roomName: m.roomName,
    isProtected: m.isProtected,
    setLabel,
    programAbbrev: detail.programAbbrev ?? null,
    movable: !m.isProtected,
    placed: true,
  }));
}


