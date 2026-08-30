import { useCallback, useEffect, useState } from "react";
import { extendMajorTimetableSelection, type MajorTimetableSlot } from "./major-scheduling-timetable-selection";

export type TimetableSelectionState = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
} | null;

export function useTimetableSlotSelection<T extends MajorTimetableSlot>(
  slots: T[],
  onCommitSelection?: (selection: { dayOfWeek: string; startTime: string; endTime: string }) => void,
) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDay, setDragDay] = useState<string | null>(null);
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null);
  const [selection, setSelection] = useState<TimetableSelectionState>(null);

  const startSelection = useCallback(
    (dayOfWeek: string, slotIndex: number) => {
      setIsDragging(true);
      setDragDay(dayOfWeek);
      setAnchorIndex(slotIndex);
      const slot = slots[slotIndex];
      if (slot) {
        setSelection({
          dayOfWeek,
          startTime: slot.start,
          endTime: slot.end,
        });
      }
    },
    [slots],
  );

  const hoverSlot = useCallback(
    (dayOfWeek: string, slotIndex: number) => {
      if (!isDragging || dragDay !== dayOfWeek || anchorIndex == null) return;
      const res = extendMajorTimetableSelection(slots, anchorIndex, slotIndex);
      setSelection({
        dayOfWeek,
        startTime: res.startTime,
        endTime: res.endTime,
      });
    },
    [anchorIndex, dragDay, isDragging, slots],
  );

  const finishSelection = useCallback(() => {
    if (isDragging && selection && onCommitSelection) {
      onCommitSelection(selection);
    }
    setIsDragging(false);
    setDragDay(null);
    setAnchorIndex(null);
  }, [isDragging, onCommitSelection, selection]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsDragging(false);
    setDragDay(null);
    setAnchorIndex(null);
  }, []);

  useEffect(() => {
    function handleMouseUp() {
      if (isDragging) {
        finishSelection();
      }
    }
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [finishSelection, isDragging]);

  return {
    selection,
    isDragging,
    startSelection,
    hoverSlot,
    finishSelection,
    clearSelection,
    setSelection,
  };
}
