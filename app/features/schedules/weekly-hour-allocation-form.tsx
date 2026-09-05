import { useState } from "react";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/forms/form-error";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { PlusIcon, TrashIcon } from "~/components/ui/icons";
import { generateTimeSlots } from "~/types/schedule";
import { formatTime12h, timeToMinutes } from "~/lib/time";
import type { CreateWeeklyHourAllocationInput, LabSlot } from "~/types/weekly-hour-allocation";

type Props = {
  types: string[];
  onSubmit: (input: CreateWeeklyHourAllocationInput) => Promise<void>;
};

const TIME_OPTIONS = generateTimeSlots().map(formatTime12h);

const HAS_LAB_TYPES = new Set(["Major with Lab"]);

export function WeeklyHourAllocationForm({ types, onSubmit }: Props) {
  const [subjectType, setSubjectType] = useState("");
  const [lectureHours, setLectureHours] = useState("");
  const [labHours, setLabHours] = useState("");
  const [meetings, setMeetings] = useState("");
  const [labSlots, setLabSlots] = useState<LabSlot[]>([{ start: "", end: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLab = HAS_LAB_TYPES.has(subjectType);

  function addLabSlot() {
    const last = labSlots[labSlots.length - 1];
    if (!last?.start || !last?.end) {
      setError("Complete the current lab time slot before adding another.");
      return;
    }
    setError(null);
    setLabSlots([...labSlots, { start: last.end, end: "" }]);
  }

  function updateLabSlot(index: number, field: keyof LabSlot, value: string) {
    const updated = labSlots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot));
    setLabSlots(updated);
    setError(null);
  }

  function removeLabSlot(index: number) {
    setLabSlots(labSlots.filter((_, i) => i !== index));
  }

  function validateSlots(): LabSlot[] | null {
    const filled = labSlots.filter((s) => s.start && s.end);
    for (const slot of filled) {
      if (timeToMinutes(slot.end) <= timeToMinutes(slot.start)) {
        setError(`Lab slot end must be after start: ${slot.start} - ${slot.end}`);
        return null;
      }
    }
    for (let i = 0; i < filled.length; i++) {
      for (let j = i + 1; j < filled.length; j++) {
        const a = filled[i], b = filled[j];
        if (timeToMinutes(a.start) < timeToMinutes(b.end) && timeToMinutes(a.end) > timeToMinutes(b.start)) {
          setError(`Lab time slots overlap: ${a.start}-${a.end} and ${b.start}-${b.end}`);
          return null;
        }
      }
    }
    return filled;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!subjectType) { setError("Select a subject type."); return; }
    const lec = parseFloat(lectureHours);
    if (!Number.isFinite(lec) || lec < 0) { setError("Enter valid lecture hours."); return; }
    const lab = hasLab ? parseFloat(labHours) : 0;
    if (hasLab && (!Number.isFinite(lab) || lab < 0)) { setError("Enter valid lab hours."); return; }
    const m = parseInt(meetings);
    if (!Number.isInteger(m) || m < 1 || m > 3) { setError("Meetings per week must be 1-3."); return; }

    let labTimeSlots: LabSlot[] | undefined;
    if (hasLab) {
      const validated = validateSlots();
      if (!validated) return;
      if (validated.length === 0) { setError("Add at least one lab time slot."); return; }
      labTimeSlots = validated;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        subjectType,
        lectureHours: lec,
        labHours: lab,
        meetings: m,
        labTimeSlots,
      });
      setSubjectType("");
      setLectureHours("");
      setLabHours("");
      setMeetings("");
      setLabSlots([{ start: "", end: "" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <FieldChrome id="wh-subject-type" label="Subject Type">
        <Select
          items={[{ value: "", label: "— Select subject type —" }, ...types.map((t) => ({ value: t, label: t }))]}
          value={subjectType}
          onValueChange={(v) => {
            const next = v as string;
            setSubjectType(next);
            setError(null);
            if (!HAS_LAB_TYPES.has(next)) {
              setLabHours("");
              setLabSlots([{ start: "", end: "" }]);
              setMeetings("");
            } else {
              setMeetings("2");
            }
          }}
        >
          <SelectTrigger id="wh-subject-type">
            <SelectValue placeholder="Select subject type…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Select subject type —</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      {subjectType && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="wh-lec-hours"
              label="Lecture Hours/Week"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              required
              value={lectureHours}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-"].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => { setLectureHours(e.target.value); setError(null); }}
            />
            <Input
              id="wh-lab-hours"
              label="Lab Hours/Week"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              disabled={!hasLab}
              value={hasLab ? labHours : ""}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-"].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => { setLabHours(e.target.value); setError(null); }}
            />
          </div>

          <Input
            id="wh-meetings"
            label="Meetings/Week"
            type="number"
            inputMode="numeric"
            min={1}
            max={3}
            required
            disabled={hasLab}
            value={meetings}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-", "."].includes(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => { setMeetings(e.target.value); setError(null); }}
            hint={hasLab ? "Locked to 2 meetings (1 lecture, 1 lab)." : "Typically 1 or 2 meetings."}
          />

          {hasLab && (
            <div className="flex flex-col gap-2">
              <label className="font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                Allowed Lab Time Slots <span className="text-red-500">*</span>
              </label>
              <p className="font-body text-xs text-slate-400 dark:text-slate-500">
                Specify acceptable start and end times for the 3-hour lab block (e.g. 7:30 AM - 10:30 AM).
              </p>
              <div className="flex flex-col gap-2">
                {labSlots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      items={[{ value: "", label: "Start" }, ...TIME_OPTIONS.map((t) => ({ value: t, label: t }))]}
                      value={slot.start}
                      onValueChange={(v) => updateLabSlot(i, "start", v as string)}
                    >
                      <SelectTrigger aria-label="Lab slot start time" className="flex-1">
                        <SelectValue placeholder="Start" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Start</SelectItem>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-slate-400">–</span>
                    <Select
                      items={[{ value: "", label: "End" }, ...TIME_OPTIONS.filter((t) => !slot.start || timeToMinutes(t) > timeToMinutes(slot.start)).map((t) => ({ value: t, label: t }))]}
                      value={slot.end}
                      onValueChange={(v) => updateLabSlot(i, "end", v as string)}
                    >
                      <SelectTrigger aria-label="Lab slot end time" className="flex-1">
                        <SelectValue placeholder="End" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">End</SelectItem>
                        {TIME_OPTIONS.filter((t) => !slot.start || timeToMinutes(t) > timeToMinutes(slot.start)).map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {labSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLabSlot(i)}
                        aria-label="Remove slot"
                        className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10 dark:hover:text-red-400"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" block={false} onClick={addLabSlot}>
                  <PlusIcon />
                  Add slot
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end">
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…" disabled={!subjectType}>
          Save allocation
        </Button>
      </div>
    </form>
  );
}
