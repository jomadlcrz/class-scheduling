import { useState } from "react";
import { Badge } from "../../components/ui/badge";
import { CloseIcon, CopyIcon, EditIcon } from "../../components/ui/icons";
import { getBuildingTone } from "../../types/building";
import { DAY_LABELS, DAY_SHORT, DAYS, formatTime, type Day } from "../../types/schedule";
import type { PendingSlot } from "./slot-entry-form";

type PendingSlotsProps = {
  slots: PendingSlot[];
  onEdit: (tempId: string) => void;
  onDuplicate: (tempId: string, day: Day) => void;
  onRemove: (tempId: string) => void;
};

export function PendingSlots({ slots, onEdit, onDuplicate, onRemove }: PendingSlotsProps) {
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [duplicateDay, setDuplicateDay] = useState<Day>("M");

  function getAvailableDays(tempId: string): Day[] {
    const slot = slots.find((s) => s.tempId === tempId);
    if (!slot) return [];
    const occupiedDays = new Set(
      slots.filter((s) => s.tempId !== tempId && s.subjectId === slot.subjectId).map((s) => s.day),
    );
    return DAYS.filter((d) => d !== slot.day && !occupiedDays.has(d));
  }

  function openDuplicate(tempId: string) {
    const available = getAvailableDays(tempId);
    setDuplicatingId(tempId);
    setDuplicateDay(available[0] ?? "M");
  }

  function confirmDuplicate() {
    if (!duplicatingId) return;
    onDuplicate(duplicatingId, duplicateDay);
    setDuplicatingId(null);
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="font-medium text-slate-500 dark:text-slate-400">No slots added yet</p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
          Use the form to add time slots for this set.
        </p>
      </div>
    );
  }

  const sorted = [...slots].sort(
    (a, b) =>
      DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
  );

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map((slot) => (
        <div
          key={slot.tempId}
          className="flex flex-col rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
        >
          <div className="flex items-center gap-2 px-3 py-2.5">
            {/* Day chip */}
            <span className="w-8 shrink-0 text-center text-xs font-semibold uppercase tracking-wide text-navy-700 dark:text-white">
              {DAY_SHORT[slot.day]}
            </span>

            {/* Main content — two lines */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                </span>
                <span className="text-xs font-medium text-navy-700 dark:text-sky-300">
                  {slot.subjectCode}
                </span>
                <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {slot.subjectTitle}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {slot.facultyName}
                </span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <Badge tone={getBuildingTone(slot.buildingCode)}>{slot.buildingCode}</Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400">{slot.roomName}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => onEdit(slot.tempId)}
                aria-label={`Edit ${DAY_LABELS[slot.day]} slot`}
                title="Edit"
                className="grid size-6 cursor-pointer place-items-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <EditIcon />
              </button>
              <button
                type="button"
                onClick={() => openDuplicate(slot.tempId)}
                aria-label={`Duplicate ${DAY_LABELS[slot.day]} slot`}
                title="Duplicate to another day"
                className={`grid size-6 cursor-pointer place-items-center rounded transition-colors ${
                  duplicatingId === slot.tempId
                    ? "bg-navy-100 text-navy-700 dark:bg-white/10 dark:text-white"
                    : "text-slate-400 hover:bg-slate-100 hover:text-navy-700 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                <CopyIcon />
              </button>
              <button
                type="button"
                onClick={() => onRemove(slot.tempId)}
                aria-label={`Remove ${DAY_LABELS[slot.day]} slot`}
                title="Remove"
                className="grid size-6 cursor-pointer place-items-center rounded text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          </div>

          {duplicatingId === slot.tempId && (() => {
            const availableDays = getAvailableDays(slot.tempId);
            return (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/5 dark:bg-white/5">
              {availableDays.length === 0 ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Already scheduled on all other days.
                </span>
              ) : (
                <>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Copy to:
                  </span>
                  <select
                    value={duplicateDay}
                    onChange={(e) => setDuplicateDay(e.target.value as Day)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:border-white/10 dark:bg-navy-800 dark:text-white"
                  >
                    {availableDays.map((d) => (
                      <option key={d} value={d}>{DAY_LABELS[d]}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={confirmDuplicate}
                    className="rounded-md bg-navy-800 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:bg-white/10 dark:hover:bg-white/20"
                  >
                    Duplicate
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setDuplicatingId(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
