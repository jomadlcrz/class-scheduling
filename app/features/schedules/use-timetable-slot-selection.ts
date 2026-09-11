import { useCallback, useEffect, useRef, useState } from "react";
import { timeToMinutes } from "~/lib/time";
import { MINIMUM_MEETING_HOURS } from "~/features/schedules/major-slot-fit";
import {
  extendMajorTimetableSelection,
  isSameTimetableTrack,
  isTimetableSlotSelected,
  type MajorTimetableMeeting,
  type MajorTimetableSlot,
} from "~/features/schedules/major-scheduling-timetable-selection";

export type TimetableAnchorRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const MINIMUM_SELECTION_MINUTES = MINIMUM_MEETING_HOURS * 60;

export type ModernTimetableSlotSelectionOptions = {
  activeSlotSelection?: MajorTimetableSlot | null;
  meetings: readonly MajorTimetableMeeting[];
  isLaboratoryRoom: (roomId: number) => boolean;
  labTimeSlots?: { startTime: string; endTime: string }[];
  allowShiftAnchor?: boolean;
  onFreeSlotClick?: (slot: MajorTimetableSlot, anchor: TimetableAnchorRect) => void;
  onSelectionChange?: (slot: MajorTimetableSlot) => void;
  onSelectionClear?: () => void;
  onShiftSelectionComplete?: (
    slot: MajorTimetableSlot,
    anchor: TimetableAnchorRect,
  ) => void;
};

export type TimetableSelectionState = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
} | null;

function rectOf(rect: DOMRect): TimetableAnchorRect {
  return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left };
}

function useModernTimetableSlotSelection({
  activeSlotSelection,
  meetings,
  isLaboratoryRoom,
  labTimeSlots = [],
  allowShiftAnchor = false,
  onFreeSlotClick,
  onSelectionChange,
  onSelectionClear,
  onShiftSelectionComplete,
}: ModernTimetableSlotSelectionOptions) {
  const [shiftSelection, setShiftSelection] = useState<MajorTimetableSlot | null>(null);
  const [highlightedScheduleId, setHighlightedScheduleId] = useState<number | null>(null);
  const shiftSelectionRef = useRef<MajorTimetableSlot | null>(null);
  const shiftAnchorRef = useRef<TimetableAnchorRect | null>(null);
  const shiftDraggingRef = useRef(false);
  const dragOriginRef = useRef<MajorTimetableSlot | null>(null);
  const dragOriginAnchorRef = useRef<TimetableAnchorRect | null>(null);
  const suppressNextClickRef = useRef(false);

  function snapToLabSlot(slot: MajorTimetableSlot) {
    if (!isLaboratoryRoom(slot.roomId)) return slot;
    const configured = labTimeSlots.find(
      (item) =>
        timeToMinutes(item.startTime) <= timeToMinutes(slot.startTime) &&
        timeToMinutes(item.endTime) >= timeToMinutes(slot.endTime),
    );
    return configured
      ? { ...slot, startTime: configured.startTime, endTime: configured.endTime }
      : null;
  }

  useEffect(() => {
    function commitSelection() {
      const selection = shiftSelectionRef.current;
      const anchor = shiftAnchorRef.current;
      const durationMinutes = selection
        ? timeToMinutes(selection.endTime) - timeToMinutes(selection.startTime)
        : 0;
      if (selection && anchor && durationMinutes >= MINIMUM_SELECTION_MINUTES) {
        onShiftSelectionComplete?.(selection, anchor);
      }
      shiftSelectionRef.current = null;
      shiftAnchorRef.current = null;
      shiftDraggingRef.current = false;
      dragOriginRef.current = null;
      dragOriginAnchorRef.current = null;
      setShiftSelection(null);
    }
    function finishShiftSelection(event: KeyboardEvent) {
      if (event.key === "Shift") commitSelection();
    }
    function finishDrag() {
      shiftDraggingRef.current = false;
      dragOriginRef.current = null;
      dragOriginAnchorRef.current = null;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    }
    window.addEventListener("keyup", finishShiftSelection);
    window.addEventListener("mouseup", finishDrag);
    return () => {
      window.removeEventListener("keyup", finishShiftSelection);
      window.removeEventListener("mouseup", finishDrag);
    };
  }, [onShiftSelectionComplete]);

  function extendShiftSelection(
    slot: MajorTimetableSlot,
    rect: DOMRect,
    rangeOrigin = shiftSelectionRef.current ?? activeSlotSelection,
    anchorOrigin = shiftAnchorRef.current,
  ) {
    setHighlightedScheduleId(null);
    const snappedSlot = snapToLabSlot(slot);
    if (!snappedSlot) return;
    slot = snappedSlot;
    const isLaboratory = isLaboratoryRoom(slot.roomId);
    const sameRange = !isLaboratory && isSameTimetableTrack(rangeOrigin, slot);
    const nextSelection = extendMajorTimetableSelection({
      origin: rangeOrigin,
      target: slot,
      meetings,
      laboratory: isLaboratory,
    });
    if (!nextSelection) return;
    let nextAnchor = rectOf(rect);
    if (sameRange && anchorOrigin) {
      nextAnchor = {
        top: Math.min(anchorOrigin.top, rect.top),
        right: Math.max(anchorOrigin.right, rect.right),
        bottom: Math.max(anchorOrigin.bottom, rect.bottom),
        left: Math.min(anchorOrigin.left, rect.left),
      };
    }
    shiftSelectionRef.current = nextSelection;
    shiftAnchorRef.current = nextAnchor;
    setShiftSelection(nextSelection);
    onSelectionChange?.(nextSelection);
  }

  function isSelectedSlot(slot: MajorTimetableSlot) {
    const selection = shiftSelectionRef.current ?? activeSlotSelection;
    return isTimetableSlotSelected(selection, slot);
  }

  function clearSelection() {
    setHighlightedScheduleId(null);
    setShiftSelection(null);
    shiftSelectionRef.current = null;
    shiftAnchorRef.current = null;
    shiftDraggingRef.current = false;
    dragOriginRef.current = null;
    dragOriginAnchorRef.current = null;
    onSelectionClear?.();
  }

  function removeSelectedEdge(slot: MajorTimetableSlot) {
    const selection = shiftSelectionRef.current ?? activeSlotSelection;
    if (!selection || !isSelectedSlot(slot)) return false;
    const selectionStart = timeToMinutes(selection.startTime);
    const selectionEnd = timeToMinutes(selection.endTime);
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    if (slotStart !== selectionStart && slotEnd !== selectionEnd) return true;
    if (slotStart === selectionStart && slotEnd === selectionEnd) {
      clearSelection();
      return true;
    }
    const nextSelection = {
      ...selection,
      startTime: slotStart === selectionStart ? slot.endTime : selection.startTime,
      endTime: slotEnd === selectionEnd ? slot.startTime : selection.endTime,
    };
    setShiftSelection(null);
    shiftSelectionRef.current = null;
    shiftAnchorRef.current = null;
    onSelectionChange?.(nextSelection);
    return true;
  }

  function chooseSlot(event: React.MouseEvent, slot: MajorTimetableSlot) {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const snappedSlot = snapToLabSlot(slot);
    if (!snappedSlot) return;
    slot = snappedSlot;
    setHighlightedScheduleId(null);
    const isLaboratory = isLaboratoryRoom(slot.roomId);
    if (event.shiftKey) {
      const activeSelection = shiftSelectionRef.current ?? activeSlotSelection;
      if (!activeSelection) {
        if (!allowShiftAnchor) return;
      } else {
        if (removeSelectedEdge(slot)) return;
        extendShiftSelection(slot, rect, activeSelection, shiftAnchorRef.current);
        return;
      }
    }
    setShiftSelection(null);
    shiftSelectionRef.current = null;
    shiftAnchorRef.current = null;
    if (isLaboratory) {
      const labMinutes =
        timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
      if (labMinutes < MINIMUM_SELECTION_MINUTES) return;
      onSelectionChange?.(slot);
      onShiftSelectionComplete?.(slot, rectOf(rect));
      return;
    }
    onFreeSlotClick?.(slot, rectOf(rect));
  }

  function selectLabSlot(slot: MajorTimetableSlot) {
    const snappedSlot = snapToLabSlot(slot);
    if (!snappedSlot) return;
    setHighlightedScheduleId(null);
    setShiftSelection(null);
    shiftSelectionRef.current = null;
    shiftAnchorRef.current = null;
    onSelectionChange?.(snappedSlot);
  }

  function startShiftDrag(event: React.MouseEvent, slot: MajorTimetableSlot) {
    if (!event.shiftKey) return;
    event.preventDefault();
    const existingSelection = shiftSelectionRef.current ?? activeSlotSelection;
    if (!existingSelection && !allowShiftAnchor) return;
    if (removeSelectedEdge(slot)) {
      suppressNextClickRef.current = true;
      return;
    }
    if (existingSelection && !isSameTimetableTrack(existingSelection, slot)) return;
    shiftDraggingRef.current = true;
    suppressNextClickRef.current = true;
    const rect = event.currentTarget.getBoundingClientRect();
    dragOriginRef.current = existingSelection ?? slot;
    dragOriginAnchorRef.current = shiftAnchorRef.current ?? rectOf(rect);
    extendShiftSelection(slot, rect, dragOriginRef.current, dragOriginAnchorRef.current);
  }

  function continueShiftDrag(event: React.MouseEvent, slot: MajorTimetableSlot) {
    if (!shiftDraggingRef.current || !event.shiftKey) return;
    extendShiftSelection(
      slot,
      event.currentTarget.getBoundingClientRect(),
      dragOriginRef.current,
      dragOriginAnchorRef.current,
    );
  }

  return {
    visibleSelection: shiftSelection ?? activeSlotSelection ?? null,
    highlightedScheduleId,
    setHighlightedScheduleId,
    chooseSlot,
    selectLabSlot,
    startShiftDrag,
    continueShiftDrag,
    clearSelection,
    resetShiftRange() {
      setShiftSelection(null);
      shiftSelectionRef.current = null;
      shiftAnchorRef.current = null;
    },
  };
}

function useLegacyTimetableSlotSelection<T extends { start: string; end: string }>(
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
      if (!isDragging || dragDay !== dayOfWeek || anchorIndex === null) return;
      const minIdx = Math.min(anchorIndex, slotIndex);
      const maxIdx = Math.max(anchorIndex, slotIndex);
      const startSlot = slots[minIdx];
      const endSlot = slots[maxIdx];
      if (startSlot && endSlot) {
        setSelection({
          dayOfWeek,
          startTime: startSlot.start,
          endTime: endSlot.end,
        });
      }
    },
    [isDragging, dragDay, anchorIndex, slots],
  );

  const endSelection = useCallback(() => {
    if (isDragging && selection) {
      onCommitSelection?.(selection);
    }
    setIsDragging(false);
    setDragDay(null);
    setAnchorIndex(null);
  }, [isDragging, selection, onCommitSelection]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseUp = () => endSelection();
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [isDragging, endSelection]);

  return {
    selection,
    isDragging,
    startSelection,
    hoverSlot,
    endSelection,
    clearSelection: () => setSelection(null),
  };
}

export function useTimetableSlotSelection(
  options: ModernTimetableSlotSelectionOptions,
): ReturnType<typeof useModernTimetableSlotSelection>;
export function useTimetableSlotSelection<T extends { start: string; end: string }>(
  slots: T[],
  onCommitSelection?: (selection: { dayOfWeek: string; startTime: string; endTime: string }) => void,
): ReturnType<typeof useLegacyTimetableSlotSelection>;
export function useTimetableSlotSelection(
  arg1: any,
  arg2?: any,
): any {
  if (Array.isArray(arg1)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useLegacyTimetableSlotSelection(arg1, arg2);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useModernTimetableSlotSelection(arg1);
}
