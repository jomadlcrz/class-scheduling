import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FieldChrome } from "~/components/ui/input";
import { InfoCircleIcon, PlusIcon, TrashIcon } from "~/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { DeanAvailabilityDecision } from "~/features/faculty/dean-availability-decision";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { PageHeader } from "~/layouts/page-header";
import { instructorAvailabilityService } from "~/services/instructor-availability.service";
import {
  AVAILABILITY_WEEK_DAYS as WEEK_DAYS,
  type AvailabilityConfiguration,
  type AvailabilityWindow,
} from "~/types/instructor-availability";

const DEFAULT_WINDOW = {
  startTime: "07:00",
  endTime: "18:00",
};

type DraftWindow = AvailabilityWindow & { key: string };

let keySeed = 0;
const nextKey = () => `win_${++keySeed}`;

function toDrafts(windows: AvailabilityWindow[]): DraftWindow[] {
  return windows.map((w) => ({ ...w, key: nextKey() }));
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
}

function isBackwards(w: DraftWindow): boolean {
  const start = timeToMinutes(w.startTime);
  const end = timeToMinutes(w.endTime);
  return Number.isFinite(start) && Number.isFinite(end) && end <= start;
}

const timeInputClass =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-body text-sm tabular-nums text-navy-800 " +
  "focus-visible:border-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/30 " +
  "dark:border-white/15 dark:bg-surface-raised dark:text-mist-100";

export function MyAvailabilityPage() {
  const { context, loading: termLoading, selectTerm } = useTermContext();
  const selectedSyId = context?.selection.syId;
  const selectedSemester = context?.selection.semesterNumber;

  const [drafts, setDrafts] = useState<DraftWindow[]>([]);
  const [note, setNote] = useState("");
  const [declared, setDeclared] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // What the Dean SET — its own record and endpoint, loaded beside the
  // declaration so a failure of one never blanks the other.
  const [configuration, setConfiguration] = useState<AvailabilityConfiguration | null>(null);
  const [configurationError, setConfigurationError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<string | undefined>(undefined);
  const [submissionStateLabel, setSubmissionStateLabel] = useState<string | undefined>(undefined);
  const [canSubmit, setCanSubmit] = useState<boolean>(true);
  const [reopenNote, setReopenNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (selectedSyId == null || selectedSemester == null) return;
    setLoading(true);
    setLoadError(null);
    setConfigurationError(null);
    const [declarationResult, configurationResult] = await Promise.allSettled([
      instructorAvailabilityService.get(selectedSyId, selectedSemester),
      instructorAvailabilityService.getConfiguration(selectedSyId, selectedSemester),
    ]);
    if (declarationResult.status === "fulfilled") {
      const declaration = declarationResult.value;
      setDrafts(toDrafts(declaration.windows));
      setNote(declaration.note ?? "");
      setDeclared(declaration.declared);
      setUpdatedAt(declaration.updatedAt ?? declaration.submittedAt);
      setSubmissionState(declaration.submissionState);
      setSubmissionStateLabel(declaration.submissionStateLabel);
      setCanSubmit(declaration.canSubmit ?? true);
      setReopenNote(declaration.reopenNote ?? null);
      setDirty(false);
    } else {
      const err = declarationResult.reason;
      setLoadError(err instanceof Error ? err.message : "Could not load your availability.");
    }
    if (configurationResult.status === "fulfilled") {
      setConfiguration(configurationResult.value);
    } else {
      const err = configurationResult.reason;
      setConfiguration(null);
      setConfigurationError(
        err instanceof Error ? err.message : "Could not load what your Dean set.",
      );
    }
    setLoading(false);
  }, [selectedSemester, selectedSyId]);

  useEffect(() => {
    if (termLoading || selectedSyId == null || selectedSemester == null) return;
    load();
  }, [termLoading, load, selectedSemester, selectedSyId]);

  const byDay = useMemo(() => {
    const grouped = new Map<string, DraftWindow[]>();
    for (const day of WEEK_DAYS) grouped.set(day, []);
    for (const draft of drafts) grouped.get(draft.dayOfWeek)?.push(draft);
    return grouped;
  }, [drafts]);

  const backwards = drafts.filter(isBackwards);

  function addWindow(day: string) {
    setDrafts((current) => [...current, { ...DEFAULT_WINDOW, dayOfWeek: day, key: nextKey() }]);
    setDirty(true);
  }

  function removeWindow(key: string) {
    setDrafts((current) => current.filter((w) => w.key !== key));
    setDirty(true);
  }

  function editWindow(key: string, field: "startTime" | "endTime", value: string) {
    setDrafts((current) => current.map((w) => (w.key === key ? { ...w, [field]: value } : w)));
    setDirty(true);
  }

  async function handleSave() {
    if (selectedSyId == null || selectedSemester == null || backwards.length > 0) return;
    setSaving(true);
    try {
      const saved = await instructorAvailabilityService.save(selectedSyId, selectedSemester, {
        note: note.trim() || null,
        windows: drafts.map(({ dayOfWeek, startTime, endTime }) => ({
          dayOfWeek,
          startTime,
          endTime,
        })),
      });
      setDrafts(toDrafts(saved.windows));
      setNote(saved.note ?? "");
      setDeclared(saved.declared);
      setUpdatedAt(saved.updatedAt ?? saved.submittedAt);
      setDirty(false);
      toast.success("Your availability was submitted to your dean.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your availability.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="My Availability"
        actions={
          context && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-40">
                <FieldChrome id="avail-sy" label="School year">
                  <Select
                    items={context.schoolYears.map((sy) => ({ value: String(sy.id), label: sy.schoolYear }))}
                    value={selectedSyId ? String(selectedSyId) : ""}
                    onValueChange={(val) => {
                      if (val && selectedSemester) selectTerm(Number(val), selectedSemester);
                    }}
                  >
                    <SelectTrigger id="avail-sy">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {context.schoolYears.map((sy) => (
                        <SelectItem key={sy.id} value={String(sy.id)}>
                          {sy.schoolYear}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
              </div>
              <div className="w-40">
                <FieldChrome id="avail-sem" label="Semester">
                  <Select
                    items={context.semesters.map((sem) => ({
                      value: String(sem.semesterNumber),
                      label: sem.label,
                    }))}
                    value={selectedSemester ? String(selectedSemester) : ""}
                    onValueChange={(val) => {
                      if (val && selectedSyId) selectTerm(selectedSyId, Number(val));
                    }}
                  >
                    <SelectTrigger id="avail-sem">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {context.semesters.map((sem) => (
                        <SelectItem key={sem.semesterNumber} value={String(sem.semesterNumber)}>
                          {sem.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
              </div>
            </div>
          )
        }
      />

      {termLoading || loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : loadError ? (
        <div className="mt-6">
          <EmptyState title="Unable to load availability">{loadError}</EmptyState>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <Card className="flex items-start gap-3 border-sky-300 bg-sky-50/70 p-4 dark:border-sky-400/30 dark:bg-sky-400/10">
            <span className="mt-0.5 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true">
              <InfoCircleIcon size={18} />
            </span>
            <div className="font-body text-sm text-sky-950 dark:text-sky-100">
              <p className="font-medium">Declaration notice</p>
              <p className="mt-1 leading-relaxed">
                This is a message to your dean, not a hard schedule booking. Your dean reviews what you submit and
                configures the availability hours that the scheduling system respects. Leaving hours blank indicates
                unrestricted availability across the normal teaching day.
              </p>
            </div>
          </Card>

          <DeanAvailabilityDecision configuration={configuration} error={configurationError} />

          {reopenNote && (
            <Card className="flex items-start gap-3 border-amber-300 bg-amber-50/70 p-4 dark:border-amber-400/30 dark:bg-amber-400/10">
              <span className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true">
                <InfoCircleIcon size={18} />
              </span>
              <div className="font-body text-sm text-amber-950 dark:text-amber-100">
                <p className="font-medium">Availability reopened by your Dean</p>
                <p className="mt-1 leading-relaxed">{reopenNote}</p>
                <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                  You may update and submit your availability again.
                </p>
              </div>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
                  <div>
                    <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
                      Teaching Hours
                    </h2>
                    <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                      Specify the time ranges you are available to teach each day
                    </p>
                  </div>
                  <span className="font-body text-xs font-medium text-slate-600 dark:text-slate-300">
                    {drafts.length === 0 ? "No times set" : `${drafts.length} time range${drafts.length === 1 ? "" : "s"}`}
                  </span>
                </div>

                <ul className="divide-y divide-slate-200 dark:divide-white/10">
                  {WEEK_DAYS.map((day) => {
                    const rows = byDay.get(day) ?? [];
                    return (
                      <li key={day} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                        <span className="shrink-0 pt-1 font-body text-sm font-semibold text-navy-800 sm:w-28 dark:text-mist-100">
                          {day}
                        </span>

                        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                          {rows.length === 0 ? (
                            <p className="font-body text-sm italic text-slate-400 dark:text-slate-500">
                              Not available
                            </p>
                          ) : (
                            rows.map((w) => (
                              <div key={w.key} className="flex flex-wrap items-center gap-2">
                                <input
                                  type="time"
                                  aria-label={`${day} start time`}
                                  value={w.startTime}
                                  onChange={(e) => editWindow(w.key, "startTime", e.target.value)}
                                  className={timeInputClass}
                                />
                                <span className="font-body text-slate-400 dark:text-slate-500">to</span>
                                <input
                                  type="time"
                                  aria-label={`${day} end time`}
                                  value={w.endTime}
                                  onChange={(e) => editWindow(w.key, "endTime", e.target.value)}
                                  className={timeInputClass}
                                />
                                {isBackwards(w) && (
                                  <span className="font-body text-xs text-red-600 dark:text-red-400">
                                    End time must be after start time
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeWindow(w.key)}
                                  aria-label={`Remove ${day} ${w.startTime} to ${w.endTime}`}
                                  className="ml-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600 dark:hover:bg-white/10"
                                >
                                  <TrashIcon size={16} />
                                </button>
                              </div>
                            ))
                          )}

                          <button
                            type="button"
                            onClick={() => addWindow(day)}
                            className="mt-1 inline-flex w-fit cursor-pointer items-center gap-1 font-body text-xs font-semibold text-navy-700 hover:underline dark:text-gold-300"
                          >
                            <PlusIcon size={14} />
                            Add time window
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card className="flex flex-col gap-4 p-5">
                <div>
                  <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
                    Additional Notes
                  </h2>
                  <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                    Provide context for your preferred hours or schedule constraints
                  </p>
                </div>

                <Textarea
                  id="availability-note"
                  label="Additional notes"
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setDirty(true);
                  }}
                  rows={6}
                  maxLength={1000}
                  placeholder="e.g. Teaching graduate courses on Tuesday mornings, preferred morning sessions on Fridays."
                />

                <p className="font-body text-xs text-slate-400 dark:text-slate-500">
                  {updatedAt
                    ? `Last updated: ${new Date(updatedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}`
                    : "No submission recorded yet"}
                </p>

                <div className="pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving || backwards.length > 0 || !canSubmit}
                    className="w-full"
                  >
                    {saving
                      ? "Submitting…"
                      : !canSubmit
                        ? (submissionStateLabel ?? "Submission locked")
                        : declared
                          ? "Update availability"
                          : "Submit availability to dean"}
                  </Button>
                </div>

                {!canSubmit && (
                  <p className="font-body text-center text-xs text-slate-500 dark:text-slate-400">
                    {submissionStateLabel ?? "Your availability cannot be modified right now."}
                  </p>
                )}

                {dirty && !saving && canSubmit && (
                  <p className="font-body text-center text-xs text-amber-600 dark:text-gold-300">
                    You have unsaved changes.
                  </p>
                )}

                {backwards.length > 0 && (
                  <p className="font-body text-center text-xs text-red-600 dark:text-red-400">
                    Fix any time windows where end time is before start time.
                  </p>
                )}
              </Card>

              <Card className="p-5">
                <p className="font-body text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Overlapping time windows submitted for the same day will automatically be merged together by the system.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
