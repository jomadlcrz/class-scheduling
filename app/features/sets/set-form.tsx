import { useState } from "react";
import { Link } from "react-router";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome } from "~/components/ui/input";
import { ModalActions } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type { Program } from "~/types/program";
import { setSchema } from "~/schemas/set.schema";
import { type ClassSet, type CreateSetInput } from "~/types/set";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { YearLevel } from "~/types/subject";

type SetFormProps = {
  /** Provided when editing an existing set. */
  set?: ClassSet;
  programs: Program[];
  /** Called with one input per set code line (create); one item for edit. */
  onSubmit: (inputs: CreateSetInput[]) => Promise<void>;
  onCancel: () => void;
};

export function SetForm({ set, programs, onSubmit, onCancel }: SetFormProps) {
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState(set?.program ?? "");

  const isEdit = Boolean(set);
  const hasPrograms = programs.length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const program = String(data.get("set-program") ?? "").trim();
    const yearLevel = Number(data.get("set-year-level")) as YearLevel;
    const programRecord = programs.find((item) => item.abbrev === program);

    if (!program) {
      setError("Please select a program.");
      return;
    }

    const targetYearLevels = isEdit
      ? [set?.yearLevel ?? yearLevel]
      : yearLevelIds.filter((level) => level <= (programRecord?.lengthYears ?? 0));
    if (targetYearLevels.length === 0) {
      setError("The selected program has no available year levels.");
      return;
    }
    const inputs: CreateSetInput[] = [];
    for (const level of targetYearLevels) {
      const codes = String(data.get(`set-code-${level}`) ?? "")
        .split("\n")
        .map((code) => code.trim())
        .filter(Boolean);
      if (codes.length === 0) continue;
      const result = setSchema.safeParse({ program, yearLevel: level, codes });
      if (!result.success) { setError(result.error.issues[0].message); return; }
      inputs.push(...result.data.codes.map((setCode) => ({ program: result.data.program, yearLevel: level as YearLevel, setCode })));
    }

    if (inputs.length === 0) {
      setError("Enter at least one set code for a year level.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(inputs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <FieldChrome id="set-program" label="Program">
        {hasPrograms ? (
          <Select
            items={programs.map((p) => ({ value: p.abbrev, label: `${p.abbrev} — ${p.name}` }))}
            name="set-program"
            value={selectedProgram}
            onValueChange={(value) => setSelectedProgram(value ?? "")}
          >
            <SelectTrigger id="set-program">
              <SelectValue placeholder="Select a program…" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.abbrev} value={p.abbrev}>
                  {p.abbrev} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <p className="font-medium text-navy-800 dark:text-mist-100">No programs available</p>
            <p>
              You need to configure at least one academic program first before creating sets.{" "}
              <Link to="/program-curricula/new" className="font-semibold text-blue-600 underline hover:text-blue-500 dark:text-blue-400">
                Create a program
              </Link>
            </p>
          </div>
        )}
      </FieldChrome>

      {isEdit && <FieldChrome id="set-year-level" label="Year Level">
        <Select
          items={yearLevelIds.map((year) => ({ value: year, label: yearLevelLabel(year) }))}
          name="set-year-level"
          defaultValue={set?.yearLevel ?? 1}
        >
          <SelectTrigger id="set-year-level">
            <SelectValue placeholder="Select a year level…" />
          </SelectTrigger>
          <SelectContent>
            {yearLevelIds.map((year) => (
              <SelectItem key={year} value={year}>
                {yearLevelLabel(year)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>}

      {isEdit && <Textarea
        id={`set-code-${set?.yearLevel ?? 1}`}
        name={`set-code-${set?.yearLevel ?? 1}`}
        label={isEdit ? "Set Code" : "Set Code(s)"}
        rows={isEdit ? 2 : 4}
        required
        defaultValue={set?.setCode ?? ""}
        hint={isEdit ? undefined : "One code per line — each line creates a separate set."}
      />}

      {!isEdit && <div className="space-y-4">
        <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 font-body text-xs text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">Add the needed sections for every year level at once. Each year can have different set codes.</p>
        {selectedProgram && yearLevelIds.filter((level) => level <= (programs.find((item) => item.abbrev === selectedProgram)?.lengthYears ?? 0)).map((level) => <Textarea key={level} id={`set-code-${level}`} name={`set-code-${level}`} label={`${yearLevelLabel(level)} Set Code(s)`} rows={2} hint="Optional. One code per line." />)}
      </div>}

      <ModalActions>
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          block={false}
          disabled={!hasPrograms || isLoading}
          isLoading={isLoading}
          loadingLabel="Saving…"
        >
          {isEdit ? "Save Changes" : "Add Sets"}
        </Button>
      </ModalActions>
    </form>
  );
}
