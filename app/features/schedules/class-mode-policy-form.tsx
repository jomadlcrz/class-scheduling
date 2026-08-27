import { useMemo, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useClassModes } from "~/hooks/use-class-modes";
import type { ClassSet } from "~/types/set";

/** What the page hands back to save. Mirrors the POST body one-for-one. */
export type ClassModePolicyInput = {
  classMode: string;
  subjectId: number | null;
  subjectType: string | null;
  setId: number | null;
  onlineMeetings: number;
  note: string | null;
};

type SubjectOption = { id: number; code: string; title: string; subjectType?: string };

const MODE_HELP: Record<string, string> = {
  F2F: "On campus, in a room. This is the default, so a policy is only needed to change back from something else.",
  Synchronous:
    "Online, everyone at the same hour. Takes no room, but still takes the hour — the section and the instructor are both busy.",
  Asynchronous:
    "Online, in their own time. Takes no room and no hour, so it never clashes with anything. It still counts toward the instructor's load.",
  Blended:
    "Partly on campus, partly online. Choose how many of the week's meetings run online; at least one always stays in a room.",
};

const SCOPE_HELP = {
  subject_type: "Every subject of this type, for this term.",
  subject: "Every section taking this subject, for this term.",
  section: "One subject in one section. Overrides the two above.",
} as const;

type Scope = keyof typeof SCOPE_HELP;

export function ClassModePolicyForm({
  subjects,
  sets,
  subjectTypes,
  initial,
  onSubmit,
  onCancel,
}: {
  subjects: SubjectOption[];
  sets: ClassSet[];
  subjectTypes: string[];
  initial?: ClassModePolicyInput & { scope: Scope };
  onSubmit: (input: ClassModePolicyInput) => Promise<void>;
  onCancel: () => void;
}) {
  const { classModes: backendModes } = useClassModes();
  const availableModes = backendModes.length > 0 ? backendModes : ["F2F", "Synchronous", "Asynchronous", "Blended"];

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [scope, setScope] = useState<Scope>(initial?.scope ?? "subject_type");
  const [subjectType, setSubjectType] = useState(initial?.subjectType ?? "");
  const [subjectId, setSubjectId] = useState(
    initial?.subjectId != null ? String(initial.subjectId) : "",
  );
  const [setId, setSetId] = useState(initial?.setId != null ? String(initial.setId) : "");
  const [classMode, setClassMode] = useState<string>(initial?.classMode ?? availableModes[0] ?? "F2F");
  const [onlineMeetings, setOnlineMeetings] = useState(
    String(initial?.onlineMeetings ?? 1),
  );
  const [note, setNote] = useState(initial?.note ?? "");

  const sortedSubjects = useMemo(
    () => [...subjects].sort((a, b) => a.code.localeCompare(b.code)),
    [subjects],
  );

  const chosenSubject = sortedSubjects.find((s) => String(s.id) === subjectId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (scope === "subject_type" && !subjectType) {
      setError("Choose a subject type.");
      return;
    }
    if (scope !== "subject_type" && !subjectId) {
      setError("Choose a subject.");
      return;
    }
    if (scope === "section" && !setId) {
      setError("Choose a section.");
      return;
    }
    const online = Number(onlineMeetings);
    if (classMode === "Blended" && (!Number.isFinite(online) || online < 1)) {
      setError("A blended subject needs at least one online meeting a week.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        classMode,
        subjectId: scope === "subject_type" ? null : Number(subjectId),
        subjectType: scope === "subject_type" ? subjectType : null,
        setId: scope === "section" ? Number(setId) : null,
        onlineMeetings: classMode === "Blended" ? online : 0,
        note: note.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save this policy.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <FieldChrome id="cmp-scope" label="Applies to" hint={SCOPE_HELP[scope]}>
        <Select
          items={[
            { value: "subject_type", label: "A subject type" },
            { value: "subject", label: "One subject" },
            { value: "section", label: "One subject, one section" },
          ]}
          name="cmp-scope"
          value={scope}
          onValueChange={(v) => {
            if (v) {
              setScope(v as Scope);
              setError(null);
            }
          }}
        >
          <SelectTrigger id="cmp-scope">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="subject_type">A subject type</SelectItem>
            <SelectItem value="subject">One subject</SelectItem>
            <SelectItem value="section">One subject, one section</SelectItem>
          </SelectContent>
        </Select>
      </FieldChrome>

      {scope === "subject_type" ? (
        <FieldChrome id="cmp-type" label="Subject type">
          <Select
            items={subjectTypes.map((t) => ({ value: t, label: t }))}
            name="cmp-type"
            value={subjectType}
            onValueChange={(v) => v && setSubjectType(v)}
          >
            <SelectTrigger id="cmp-type">
              <SelectValue placeholder="Select a subject type" />
            </SelectTrigger>
            <SelectContent>
              {subjectTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      ) : (
        <>
          <FieldChrome
            id="cmp-subject"
            label="Subject"
            hint={chosenSubject ? chosenSubject.subjectType : undefined}
          >
            <Select
              items={sortedSubjects.map((s) => ({
                value: String(s.id),
                label: `${s.code} — ${s.title}`,
              }))}
              name="cmp-subject"
              value={subjectId}
              onValueChange={(v) => v && setSubjectId(v)}
            >
              <SelectTrigger id="cmp-subject">
                <SelectValue placeholder="Select a subject" />
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

          {scope === "section" && (
            <FieldChrome id="cmp-set" label="Section">
              <Select
                items={sets.map((s) => ({
                  value: String(s.id),
                  label: `${s.program} ${s.yearLevel}-${s.setCode}`,
                }))}
                name="cmp-set"
                value={setId}
                onValueChange={(v) => v && setSetId(v)}
              >
                <SelectTrigger id="cmp-set">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {sets.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.program} {s.yearLevel}-{s.setCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          )}
        </>
      )}

      <FieldChrome id="cmp-mode" label="Delivered" hint={MODE_HELP[classMode] ?? "Class delivery mode"}>
        <Select
          items={availableModes.map((m) => ({ value: m, label: m }))}
          name="cmp-mode"
          value={classMode}
          onValueChange={(v) => v && setClassMode(v)}
        >
          <SelectTrigger id="cmp-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableModes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      {classMode === "Blended" && (
        <Input
          id="cmp-online"
          name="cmp-online"
          label="Online meetings a week"
          hint="At least one meeting always stays on campus, whatever this says — and a laboratory always does."
          type="number"
          min={1}
          value={onlineMeetings}
          onChange={(e) => setOnlineMeetings(e.target.value)}
        />
      )}

      <Input
        id="cmp-note"
        name="cmp-note"
        label="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" block={false} disabled={saving}>
          {saving ? "Saving…" : "Save policy"}
        </Button>
      </div>
    </form>
  );
}
