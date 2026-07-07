import { useState } from "react";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/forms/form-error";
import { Input, inputClassName } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { PlusIcon, TrashIcon } from "~/components/ui/icons";
import { SUBJECT_TYPE_LABELS, type SubjectType } from "~/types/subject";
import type { CreateWeeklyHourAllocationInput, LabSlot } from "~/types/weekly-hour-allocation";

type Props = {
  types: string[];
  onSubmit: (input: CreateWeeklyHourAllocationInput) => Promise<void>;
};

const TIME_OPTIONS = [
  "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM",
];

const HAS_LAB_TYPES = new Set(["major-lab"]);

export function WeeklyHourAllocationForm({ types, onSubmit }: Props) {
  const [subjectType, setSubjectType] = useState("");
  const [lectureHours, setLectureHours] = useState("");
  const [labHours, setLabHours] = useState("");
  const [meetings, setMeetings] = useState("");
  const [labSlots, setLabSlots] = useState<LabSlot[]>([{ start: "", end: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLab = HAS_LAB_TYPES.has(subjectType as SubjectType);

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

  function timeToMinutes(t: string): number {
    const [h, m] = t.replace(/( AM| PM)/, "").split(":");
    let hour = parseInt(h);
    if (t.includes("PM") && hour !== 12) hour += 12;
    if (t.includes("AM") && hour === 12) hour = 0;
    return hour * 60 + parseInt(m ?? "0");
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
    const lab = parseFloat(labHours);
    if (!Number.isFinite(lab) || lab < 0) { setError("Enter valid lab hours."); return; }
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
        subjectType: subjectType as SubjectType,
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
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <Select
        id="wh-subject-type"
        label="Subject Type"
        value={subjectType}
        onChange={(e) => {
          setSubjectType(e.target.value);
          setError(null);
          if (!HAS_LAB_TYPES.has(e.target.value as SubjectType)) {
            setLabHours("");
            setLabSlots([{ start: "", end: "" }]);
          }
        }}
      >
        <option value="">— Select subject type —</option>
        {types.map((t) => (
          <option key={t} value={t}>{SUBJECT_TYPE_LABELS[t as SubjectType] ?? t}</option>
        ))}
      </Select>

      {subjectType && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="wh-lecture-hours"
              label="Lecture Hours"
              type="number"
              min={0}
              step="0.25"
              placeholder="e.g. 3"
              value={lectureHours}
              onChange={(e) => setLectureHours(e.target.value)}
            />
            {hasLab && (
              <Input
                id="wh-lab-hours"
                label="Lab Hours"
                type="number"
                min={0}
                step="0.25"
                placeholder="e.g. 2"
                value={labHours}
                onChange={(e) => setLabHours(e.target.value)}
              />
            )}
          </div>

          <Input
            id="wh-meetings"
            label="Meetings / Week"
            type="number"
            min={1}
            max={3}
            step="1"
            placeholder="e.g. 2"
            value={meetings}
            onChange={(e) => setMeetings(e.target.value)}
          />

          {hasLab && (
            <div className="flex flex-col gap-2">
              <label className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Laboratory Time Slots
              </label>
              {labSlots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={slot.start}
                    onChange={(e) => updateLabSlot(i, "start", e.target.value)}
                    aria-label="Lab slot start time"
                    className={`${inputClassName} flex-1`}
                  >
                    <option value="">Start</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-slate-400">–</span>
                  <select
                    value={slot.end}
                    onChange={(e) => updateLabSlot(i, "end", e.target.value)}
                    aria-label="Lab slot end time"
                    className={`${inputClassName} flex-1`}
                  >
                    {[<option key="" value="">End</option>, ...TIME_OPTIONS.filter((t) => !slot.start || timeToMinutes(t) > timeToMinutes(slot.start)).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))]}
                  </select>
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
                Add Slot
              </Button>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end">
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…" disabled={!subjectType}>
          Save Allocation
        </Button>
      </div>
    </form>
  );
}
