import { useState } from "react";
import { Link } from "react-router";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome } from "~/components/ui/input";
import { ModalActions } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { TabList } from "~/components/ui/tabs";
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
  const [activeYearLevel, setActiveYearLevel] = useState<number>(set?.yearLevel ?? 1);
  const [editYearLevel, setEditYearLevel] = useState<number>(set?.yearLevel ?? 1);
  const [codesByYearLevel, setCodesByYearLevel] = useState<Record<number, string>>({});

  const isEdit = Boolean(set);
  const hasPrograms = programs.length > 0;
  const availableYearLevels = yearLevelIds.filter(
    (level) => level <= (programs.find((item) => item.abbrev === selectedProgram)?.lengthYears ?? 0),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const program = isEdit ? selectedProgram : String(data.get("set-program") ?? "").trim();
    const yearLevel = Number(data.get("set-year-level")) as YearLevel;

    if (!program) {
      setError("Please select a program.");
      return;
    }

    const targetYearLevels = isEdit
      ? [editYearLevel || yearLevel]
      : availableYearLevels;
    if (targetYearLevels.length === 0) {
      setError("The selected program has no available year levels.");
      return;
    }
    const inputs: CreateSetInput[] = [];
    for (const level of targetYearLevels) {
      const codes = String(isEdit ? data.get(`set-code-${level}`) ?? "" : codesByYearLevel[level] ?? "")
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
            onValueChange={(value) => { setSelectedProgram(value ?? ""); setActiveYearLevel(1); setCodesByYearLevel({}); }}
            disabled={isEdit}
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

      {isEdit && <FieldChrome id="set-year-level" label="Year level">
        <Select
          items={yearLevelIds.map((year) => ({ value: year, label: yearLevelLabel(year) }))}
          name="set-year-level"
          value={editYearLevel}
          onValueChange={(value) => setEditYearLevel(Number(value ?? set?.yearLevel ?? 1))}
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
        id={`set-code-${editYearLevel}`}
        name={`set-code-${editYearLevel}`}
        label={isEdit ? "Set code" : "Set code(s)"}
        rows={isEdit ? 2 : 4}
        required
        defaultValue={set?.setCode ?? ""}
        hint={isEdit ? undefined : "One code per line — each line creates a separate set."}
      />}

      {!isEdit && selectedProgram && <div className="space-y-4">
        <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 font-body text-xs text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">Add the needed sections for every year level. Each year can have different set codes.</p>
        <TabList ariaLabel="Year level" tabs={availableYearLevels.map((level) => ({ value: level, label: yearLevelLabel(level) }))} value={activeYearLevel} onChange={setActiveYearLevel} />
        {availableYearLevels.includes(activeYearLevel) && <Textarea id={`set-code-${activeYearLevel}`} label={`${yearLevelLabel(activeYearLevel)} set code(s)`} rows={4} value={codesByYearLevel[activeYearLevel] ?? ""} onChange={(event) => setCodesByYearLevel((current) => ({ ...current, [activeYearLevel]: event.target.value }))} hint="Optional. One code per line." />}
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
          {isEdit ? "Save changes" : "Add sets"}
        </Button>
      </ModalActions>
    </form>
  );
}
