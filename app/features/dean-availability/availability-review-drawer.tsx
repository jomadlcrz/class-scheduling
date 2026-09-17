import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Drawer } from "~/components/ui/drawer";
import { InfoCircleIcon, PlusIcon, TrashIcon } from "~/components/ui/icons";
import { Textarea } from "~/components/ui/textarea";
import { WidenRequestForm } from "~/features/dean-availability/widen-request";
import { deanAvailabilityService } from "~/services/dean-availability.service";
import type {
  AvailabilityWindow,
  InstructorAvailabilityRow,
} from "~/types/dean-instructor-availability";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Draft = AvailabilityWindow & { key: string };

let keySeed = 0;
const nextKey = () => `drw_${++keySeed}`;

function toDrafts(windows: AvailabilityWindow[]): Draft[] {
  return windows.map((w) => ({ ...w, key: nextKey() }));
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
}

function isBackwards(w: { startTime: string; endTime: string }): boolean {
  const start = timeToMinutes(w.startTime);
  const end = timeToMinutes(w.endTime);
  return Number.isFinite(start) && Number.isFinite(end) && end <= start;
}

function draftHours(drafts: Draft[]): number {
  const total = drafts.reduce((sum, w) => {
    if (isBackwards(w)) return sum;
    const span = timeToMinutes(w.endTime) - timeToMinutes(w.startTime);
    return Number.isFinite(span) ? sum + span / 60 : sum;
  }, 0);
  return Math.round(total * 100) / 100;
}

const timeInputClass =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-body text-sm tabular-nums text-navy-800 " +
  "focus-visible:border-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/30 " +
  "dark:border-white/15 dark:bg-surface-raised dark:text-mist-100";

export function AvailabilityReviewDrawer({
  row,
  syId,
  semesterNumber,
  termClosed,
  readOnly = false,
  onSaved,
  onClose,
}: {
  row: InstructorAvailabilityRow | null;
  syId: number;
  semesterNumber: number;
  termClosed: boolean;
  readOnly?: boolean;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!row) return;
    const seed = row.configuration.configured
      ? row.configuration.windows
      : row.declaration.windows;
    setDrafts(toDrafts(seed));
    setNote(row.configuration.note ?? "");
  }, [row]);

  const backwards = useMemo(() => drafts.filter(isBackwards), [drafts]);
  const totalHours = draftHours(drafts);
  const hasShortfall = row != null && totalHours > 0 && totalHours < row.load.assignedWeeklyHours;

  const byDay = useMemo(() => {
    const grouped = new Map<string, Draft[]>();
    for (const day of WEEK_DAYS) grouped.set(day, []);
    for (const d of drafts) grouped.get(d.dayOfWeek)?.push(d);
    return grouped;
  }, [drafts]);

  function addWindow(day: string) {
    setDrafts((curr) => [
      ...curr,
      { dayOfWeek: day, startTime: "07:00", endTime: "18:00", key: nextKey() },
    ]);
  }

  function removeWindow(key: string) {
    setDrafts((curr) => curr.filter((d) => d.key !== key));
  }

  function editWindow(key: string, field: "startTime" | "endTime", value: string) {
    setDrafts((curr) => curr.map((d) => (d.key === key ? { ...d, [field]: value } : d)));
  }

  async function handleSave() {
    if (!row || backwards.length > 0) return;
    setSaving(true);
    try {
      await deanAvailabilityService.configure(row.instructorProfileId, syId, semesterNumber, {
        note: note.trim() || null,
        windows: drafts.map(({ dayOfWeek, startTime, endTime }) => ({
          dayOfWeek,
          startTime,
          endTime,
        })),
      });
      toast.success(`Availability configured for ${row.name}.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save availability.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (!row) return;
    setClearing(true);
    try {
      await deanAvailabilityService.clear(row.instructorProfileId, syId, semesterNumber);
      toast.success(`Availability restrictions cleared for ${row.name}.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear availability.");
    } finally {
      setClearing(false);
    }
  }

  function acceptDeclaration() {
    if (!row) return;
    setDrafts(toDrafts(row.declaration.windows));
    setNote(row.declaration.note ?? "");
  }

  return (
    <Drawer
      open={row !== null}
      onClose={onClose}
      title={row?.name ?? "Instructor Availability"}
      description={[row?.employmentStatus, row?.academicRank, row?.departmentAbbrev].filter(Boolean).join(" · ")}
      wide
    >
      {row && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-white/10 dark:bg-white/2">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Assigned Load
              </p>
              <p className="mt-0.5 font-display text-xl tracking-wide text-navy-800 dark:text-mist-100">
                {row.load.assignedWeeklyHours} weekly hours
              </p>
              <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                {row.load.assignedSubjects} assigned subject{row.load.assignedSubjects === 1 ? "" : "s"}
              </p>
            </div>

            <div className="text-right">
              <p className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Available Window
              </p>
              <p className="mt-0.5 font-display text-xl tracking-wide text-navy-800 dark:text-mist-100">
                {drafts.length === 0 ? "Unrestricted" : `${totalHours} hrs`}
              </p>
              <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                {drafts.length === 0 ? "Any normal class hour" : `${drafts.length} time span${drafts.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          {hasShortfall && (
            <Card className="flex items-start gap-2.5 border-amber-300 bg-amber-50/70 p-3.5 dark:border-amber-400/30 dark:bg-amber-400/10">
              <span className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true">
                <InfoCircleIcon size={16} />
              </span>
              <p className="font-body text-xs leading-relaxed text-amber-900 dark:text-amber-100">
                Configured availability ({totalHours} hrs) is less than the assigned weekly teaching load ({row.load.assignedWeeklyHours} hrs). This may cause scheduling solver conflicts unless hours are widened.
              </p>
            </Card>
          )}

          {readOnly ? (
            <div className="flex flex-col gap-4">
              <Card className="p-4">
                <h3 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
                  Configured Hours
                </h3>
                {drafts.length === 0 ? (
                  <p className="mt-2 font-body text-sm text-slate-500 dark:text-slate-400">
                    No restrictions configured — this instructor can be scheduled at any teaching hour.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-slate-100 dark:divide-white/5">
                    {drafts.map((d) => (
                      <li key={d.key} className="flex justify-between py-2 font-body text-sm">
                        <span className="font-medium text-navy-800 dark:text-mist-100">{d.dayOfWeek}</span>
                        <span className="tabular-nums text-slate-600 dark:text-slate-300">
                          {d.startTime} – {d.endTime}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-4">
                <WidenRequestForm
                  row={row}
                  syId={syId}
                  semesterNumber={semesterNumber}
                  onSent={onSaved}
                />
              </Card>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
                  Configure Teaching Hours
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  {row.declaration.declared && (
                    <Button variant="outline" block={false} className="px-3 py-1.5 text-xs" onClick={acceptDeclaration}>
                      Use instructor&apos;s request
                    </Button>
                  )}
                  {row.configuration.configured && (
                    <Button
                      variant="outline"
                      block={false}
                      className="px-3 py-1.5 text-xs"
                      disabled={clearing || termClosed}
                      isLoading={clearing}
                      onClick={handleClear}
                    >
                      Clear all restrictions
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 dark:border-white/10 dark:divide-white/5">
                {WEEK_DAYS.map((day) => {
                  const dayRows = byDay.get(day) ?? [];
                  return (
                    <div key={day} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
                      <span className="w-28 shrink-0 pt-1 font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                        {day}
                      </span>

                      <div className="flex flex-1 flex-col gap-2">
                        {dayRows.length === 0 ? (
                          <span className="font-body text-xs text-slate-400 dark:text-slate-500">
                            No hours set
                          </span>
                        ) : (
                          dayRows.map((w) => (
                            <div key={w.key} className="flex flex-wrap items-center gap-2">
                              <input
                                type="time"
                                aria-label={`${day} start`}
                                value={w.startTime}
                                onChange={(e) => editWindow(w.key, "startTime", e.target.value)}
                                className={timeInputClass}
                              />
                              <span className="font-body text-xs text-slate-400 dark:text-slate-500">to</span>
                              <input
                                type="time"
                                aria-label={`${day} end`}
                                value={w.endTime}
                                onChange={(e) => editWindow(w.key, "endTime", e.target.value)}
                                className={timeInputClass}
                              />
                              <button
                                type="button"
                                onClick={() => removeWindow(w.key)}
                                aria-label={`Remove ${day} time`}
                                className="ml-auto inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-white/10"
                              >
                                <TrashIcon size={14} />
                              </button>
                            </div>
                          ))
                        )}

                        <button
                          type="button"
                          onClick={() => addWindow(day)}
                          className="mt-0.5 inline-flex w-fit cursor-pointer items-center gap-1 font-body text-xs font-semibold text-navy-700 hover:underline dark:text-gold-300"
                        >
                          <PlusIcon size={13} />
                          Add time
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {backwards.length > 0 && (
                <p className="font-body text-xs text-red-600 dark:text-red-400">
                  Fix any time ranges where the end time is before the start time.
                </p>
              )}

              <Textarea
                id="dean-config-note"
                label="Dean's remarks / constraints note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="e.g. Approved based on faculty department agreement for Tuesday morning scheduling."
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <Button variant="outline" block={false} onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  block={false}
                  onClick={handleSave}
                  disabled={saving || backwards.length > 0 || termClosed}
                  isLoading={saving}
                >
                  Save availability configuration
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
