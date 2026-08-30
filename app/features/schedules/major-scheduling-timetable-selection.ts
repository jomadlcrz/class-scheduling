import { timeToMinutes } from "~/lib/time";

export type MajorTimetableSlot = {
  start: string;
  end: string;
};

export function extendMajorTimetableSelection<T extends { start: string; end: string }>(
  slots: T[],
  anchorSlotIndex: number,
  targetSlotIndex: number,
): { startIndex: number; endIndex: number; startTime: string; endTime: string } {
  const minIdx = Math.min(anchorSlotIndex, targetSlotIndex);
  const maxIdx = Math.max(anchorSlotIndex, targetSlotIndex);

  const startSlot = slots[minIdx];
  const endSlot = slots[maxIdx];

  return {
    startIndex: minIdx,
    endIndex: maxIdx,
    startTime: startSlot.start,
    endTime: endSlot.end,
  };
}

export function isSlotSelected(
  slot: { start: string; end: string },
  selection: { startTime: string; endTime: string } | null,
): boolean {
  if (!selection) return false;
  const slotStart = timeToMinutes(slot.start);
  const slotEnd = timeToMinutes(slot.end);
  const selStart = timeToMinutes(selection.startTime);
  const selEnd = timeToMinutes(selection.endTime);

  return slotStart >= selStart && slotEnd <= selEnd;
}
