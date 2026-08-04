import { useState } from "react";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/forms/form-error";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { SUBJECT_TYPE_LABELS } from "~/types/subject";
import type { WeeklyHourAllocation } from "~/types/weekly-hour-allocation";
import type { ClassSet } from "~/types/set";

type SubjectOption = { id: number; code: string; title: string; subjectType: string };

export type OverrideFormInput = {
  subjectId: number;
  setId?: number | null;
  lectureHours: number;
  labHours: number;
  meetings: number;
  note?: string;
};

type Props = {
  subjects: SubjectOption[];
  sets: ClassSet[];
  allocations: WeeklyHourAllocation[];
  initial?: {
    subjectId: number;
    subjectCode?: string | null;
    setId?: number | null;
    setName?: string | null;
    lectureHours: number;
    labHours: number;
    meetings: number;
    note?: string | null;
  };
  onSubmit: (input: OverrideFormInput) => Promise<void>;
  onCancel?: () => void;
};

export function SubjectHourOverrideForm({ subjects, sets, allocations, initial, onSubmit, onCancel }: Props) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(initial ? String(initial.subjectId) : "");
  const [setId, setSetId] = useState<string>(initial?.setId != null ? String(initial.setId) : "all");
  const [lectureHours, setLectureHours] = useState(initial?.lectureHours != null ? String(initial.lectureHours) : "");
  const [labHours, setLabHours] = useState(initial?.labHours != null ? String(initial.labHours) : "");
  const [meetings, setMeetings] = useState(initial?.meetings != null ? String(initial.meetings) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingReduction, setConfirmingReduction] = useState(false);

  const selectedSubject = subjects.find((s) => String(s.id) === selectedSubjectId);
  const sortedSubjects = [...subjects].sort((a, b) => a.code.localeCompare(b.code));

  const baseline = selectedSubject
    ? allocations.find((a) => a.subjectType === selectedSubject.subjectType) ?? null
    : null;
  const baselineTotal = baseline ? baseline.lectureHours + baseline.labHours : 0;
  const baselinePerMeeting = baseline && baseline.meetings > 0 ? baselineTotal / baseline.meetings : 0;
  const subjectTypeLabel = selectedSubject
    ? SUBJECT_TYPE_LABELS[selectedSubject.subjectType] ?? selectedSubject.subjectType
    : "";

  const lec = parseFloat(lectureHours) || 0;
  const lab = parseFloat(labHours) || 0;
  const mtgs = parseInt(meetings, 10) || 0;
  const total = lec + lab;
  const delta = total - baselineTotal;
  const isReduction = baseline != null && delta < -0.001;
  const hasLab = lab > 0;
  const durationEach = mtgs > 0 ? total / mtgs : total;
  const fmt = (n: number) => (Number.isInteger(n) ? `${n}.0` : String(Math.round(n * 100) / 100));

  const selectedSet = setId === "all" ? null : sets.find((s) => s.id === Number(setId));
  const scopeLabel = selectedSet
    ? `${selectedSet.program}-${selectedSet.yearLevel}${selectedSet.setCode}`
    : "ALL SETS (every section taking this subject)";

  function handleSubjectChange(id: string) {
    setSelectedSubjectId(id);
    const sub = subjects.find((s) => String(s.id) === id);
    if (!initial && sub) {
      const alloc = allocations.find((a) => a.subjectType === sub.subjectType);
      if (alloc) {
        setLectureHours(String(alloc.lectureHours));
        setLabHours(String(alloc.labHours));
        setMeetings(String(alloc.meetings));
      }
    }
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedSubjectId) { setError("Select a subject."); return; }
    if (!Number.isFinite(lec) || lec < 0) { setError("Hours cannot be negative."); return; }
    if (!Number.isFinite(lab) || lab < 0) { setError("Hours cannot be negative."); return; }
    if (lec + lab <= 0) { setError("Total weekly hours must be greater than zero."); return; }
    if (!Number.isInteger(mtgs) || mtgs < 1) { setError("Meetings must be at least 1."); return; }
    if (lab > 0 && mtgs !== 2) { setError("Subjects with lab hours must have meetings = 2 (one lecture, one lab)."); return; }
    if (isReduction && !note.trim()) { setError("A reason is required when reducing hours below the baseline."); return; }

    if (isReduction && !confirmingReduction) {
      setConfirmingReduction(true);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        subjectId: Number(selectedSubjectId),
        setId: setId === "all" ? null : Number(setId),
        lectureHours: lec,
        labHours: lab,
        meetings: mtgs,
        note: note.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setIsLoading(false);
    }
  }

  if (confirmingReduction && selectedSubject) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-400/20 dark:bg-red-400/5">
          <p className="font-body text-sm font-medium text-red-800 dark:text-red-300">
            Confirm hour reduction
          </p>
          <p className="mt-1 font-body text-sm text-red-700 dark:text-red-400">
            {selectedSubject.code} — {scopeLabel}
          </p>
          <div className="mt-2 flex items-center gap-3 font-body text-sm tabular-nums">
            <span className="text-slate-500 dark:text-slate-400">
              {fmt(baselineTotal)}h/week
            </span>
            <span className="text-slate-400 dark:text-slate-500">→</span>
            <span className="font-medium text-red-700 dark:text-red-400">
              {fmt(total)}h/week
            </span>
            <span className="text-red-600 dark:text-red-400">
              ({fmt(delta)}h/week)
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" block={false} onClick={() => setConfirmingReduction(false)}>
            Go back
          </Button>
          <Button
            type="button"
            variant="danger"
            block={false}
            isLoading={isLoading}
            loadingLabel="Saving…"
            onClick={() => {
              setIsLoading(true);
              onSubmit({
                subjectId: Number(selectedSubjectId),
                setId: setId === "all" ? null : Number(setId),
                lectureHours: lec,
                labHours: lab,
                meetings: mtgs,
                note: note.trim() || undefined,
              })
                .catch((err) => setError(err instanceof Error ? err.message : ""))
                .finally(() => setIsLoading(false));
            }}
          >
            Confirm reduction
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <FieldChrome id="sho-subject" label="Subject">
        <Select
          value={selectedSubjectId}
          onValueChange={(v) => handleSubjectChange(v as string)}
        >
          <SelectTrigger id="sho-subject">
            <SelectValue>{selectedSubject ? `${selectedSubject.code} — ${selectedSubject.title}` : undefined}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sortedSubjects.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.code} — {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      {sets.length > 0 && (
        <FieldChrome id="sho-set" label="Set (optional)">
          <Select
            value={setId}
            onValueChange={(v) => { setSetId(v as string); setError(null); }}
          >
            <SelectTrigger id="sho-set">
              <SelectValue>{selectedSet ? `${selectedSet.program}-${selectedSet.yearLevel}${selectedSet.setCode}` : setId === "all" ? "ALL SETS (every section taking this subject)" : undefined}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL SETS (every section taking this subject)</SelectItem>
              {sets.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.program}-{s.yearLevel}{s.setCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      )}

      {baseline && selectedSubject && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
          <p className="font-body text-xs text-slate-600 dark:text-slate-300">
            Currently: {baseline.meetings} meetings × {fmt(baselinePerMeeting)}h = {fmt(baselineTotal)}h/week
            <span className="mx-1">·</span>
            <span>lecture {fmt(baseline.lectureHours)}h, lab {fmt(baseline.labHours)}h</span>
          </p>
          <p className="mt-0.5 font-body text-[0.65rem] text-slate-400 dark:text-slate-500">
            — from subject type &ldquo;{subjectTypeLabel}&rdquo;
          </p>
          {baselineTotal > 0 && (
            <p className={`mt-1 font-body text-xs font-medium tabular-nums ${
              delta < -0.001
                ? "text-red-600 dark:text-red-400"
                : delta > 0.001
                  ? "text-slate-600 dark:text-slate-300"
                  : "text-slate-400 dark:text-slate-500"
            }`}>
              {delta < -0.001
                ? `${fmt(delta)}h/week`
                : delta > 0.001
                  ? `+${fmt(delta)}h/week`
                  : "no change"}
            </p>
          )}
          {isReduction && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 dark:border-red-400/20 dark:bg-red-400/5">
              <p className="font-body text-xs text-red-700 dark:text-red-400">
                This reduces {selectedSubject.code} by {fmt(Math.abs(delta))} hrs/week for {scopeLabel}.
              </p>
              {setId === "all" && sets.length > 0 && (
                <p className="mt-0.5 font-body text-[0.65rem] text-red-600 dark:text-red-400/80">
                  Sections affected: {sets.length} sets.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="sho-lecture-hours"
          label="Lecture Hours"
          type="number"
          min={0}
          step="0.5"
          placeholder="e.g. 2"
          value={lectureHours}
          onChange={(e) => { setLectureHours(e.target.value); setError(null); }}
        />
        <Input
          id="sho-lab-hours"
          label="Lab Hours"
          type="number"
          min={0}
          step="0.5"
          placeholder="e.g. 1.5"
          value={labHours}
          onChange={(e) => { setLabHours(e.target.value); setError(null); }}
        />
      </div>

      <div>
        <Input
          id="sho-meetings"
          label={hasLab ? "Meetings / Week (locked to 2 for lab)" : "Meetings / Week"}
          type="number"
          min={1}
          max={4}
          step="1"
          placeholder="e.g. 2"
          value={meetings}
          onChange={(e) => { setMeetings(e.target.value); setError(null); }}
          disabled={hasLab}
        />
        {hasLab && (
          <p className="mt-1 font-body text-[0.65rem] text-slate-400 dark:text-slate-500">
            Subjects with lab hours must have exactly 2 meetings (one lecture, one lab).
          </p>
        )}
      </div>

      {total > 0 && mtgs >= 1 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <p className="font-body text-xs text-slate-500 dark:text-slate-400">
            {mtgs} meetings × {fmt(durationEach)}h = {fmt(total)}h / week
            {(lec > 0 || lab > 0) && (
              <>
                <span className="mx-1">·</span>
                <span>lecture {fmt(lec)}h · lab {fmt(lab)}h</span>
              </>
            )}
          </p>
        </div>
      )}

      <Input
        id="sho-note"
        label={isReduction ? "Reason for reducing hours" : "Note (optional)"}
        type="text"
        maxLength={255}
        placeholder={isReduction ? "Required — explain why hours are being reduced" : "e.g. reduced to fit lab slot availability"}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" block={false} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…" disabled={!selectedSubjectId}>
          {initial ? "Save Changes" : "Add Override"}
        </Button>
      </div>
    </form>
  );
}
