import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { FormError } from "~/components/forms/form-error";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { ClassSet } from "~/types/set";

type SubjectOption = { id: number; code: string; title: string };

export type OverrideFormInput = {
  subjectId: number;
  syId: number;
  semId: number;
  setId?: number | null;
  lectureHours: number;
  labHours: number;
  meetings: number;
  note?: string;
};

type Props = {
  subjects: SubjectOption[];
  sets: ClassSet[];
  /** Pre-fill when editing an existing override. */
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

export function SubjectHourOverrideForm({ subjects, sets, initial, onSubmit, onCancel }: Props) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(initial ? String(initial.subjectId) : "");
  const [subjectQuery, setSubjectQuery] = useState(initial?.subjectCode ?? "");
  const [setId, setSetId] = useState<string>(initial?.setId != null ? String(initial.setId) : "all");
  const [lectureHours, setLectureHours] = useState(initial?.lectureHours != null ? String(initial.lectureHours) : "");
  const [labHours, setLabHours] = useState(initial?.labHours != null ? String(initial.labHours) : "");
  const [meetings, setMeetings] = useState(initial?.meetings != null ? String(initial.meetings) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSubject = subjects.find((s) => String(s.id) === selectedSubjectId);
  const filteredSubjects = subjects.filter(
    (s) =>
      s.code.toLowerCase().includes(subjectQuery.trim().toLowerCase()) ||
      s.title.toLowerCase().includes(subjectQuery.trim().toLowerCase()),
  );

  const lec = parseFloat(lectureHours) || 0;
  const lab = parseFloat(labHours) || 0;
  const mtgs = parseInt(meetings, 10) || 0;
  const total = lec + lab;
  const hasLab = lab > 0;
  const durationEach = mtgs > 0 ? total / mtgs : total;
  const fmt = (n: number) => (Number.isInteger(n) ? `${n}.0` : String(Math.round(n * 100) / 100));

  function handleSubjectChange(id: string) {
    setSelectedSubjectId(id);
    const sub = subjects.find((s) => String(s.id) === id);
    if (sub) setSubjectQuery(sub.code);
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

    setIsLoading(true);
    try {
      await onSubmit({
        subjectId: Number(selectedSubjectId),
        syId: 0, // filled by the route page
        semId: 0, // filled by the route page
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <FieldChrome id="sho-subject" label="Subject">
        <Command
          value={selectedSubjectId}
          onValueChange={(v) => handleSubjectChange(v as string)}
          itemToStringLabel={(id) => {
            const sub = subjects.find((s) => String(s.id) === id);
            return sub ? `${sub.code} — ${sub.title}` : "";
          }}
          inputValue={subjectQuery}
          onInputValueChange={setSubjectQuery}
        >
          <CommandInput id="sho-subject" placeholder="Search subjects…" focusPlaceholder="Type to search…" />
          <CommandList>
            {filteredSubjects.length === 0 ? (
              <CommandEmpty>No subjects found.</CommandEmpty>
            ) : (
              filteredSubjects.map((s) => (
                <CommandItem key={s.id} value={String(s.id)}>
                  <span className="font-medium">{s.code}</span>
                  <span className="ml-1.5 truncate text-xs text-slate-400 dark:text-slate-500">
                    {s.title}
                  </span>
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </FieldChrome>

      {sets.length > 0 && (
        <FieldChrome id="sho-set" label="Set (optional)">
          <Select
            value={setId}
            onValueChange={(v) => { setSetId(v as string); setError(null); }}
          >
            <SelectTrigger id="sho-set">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sets</SelectItem>
              {sets.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.program}-{s.yearLevel}{s.setCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="sho-lecture-hours"
          label="Lecture Hours"
          type="number"
          min={0}
          step="0.25"
          placeholder="e.g. 2"
          value={lectureHours}
          onChange={(e) => { setLectureHours(e.target.value); setError(null); }}
        />
        <Input
          id="sho-lab-hours"
          label="Lab Hours"
          type="number"
          min={0}
          step="0.25"
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
          max={3}
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
        label="Note (optional)"
        type="text"
        maxLength={255}
        placeholder="e.g. reduced to fit lab slot availability"
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
