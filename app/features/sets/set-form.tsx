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

  const isEdit = Boolean(set);
  const hasPrograms = programs.length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const program = String(data.get("set-program") ?? "").trim();
    const yearLevel = Number(data.get("set-year-level")) as YearLevel;
    const rawCodes = String(data.get("set-code") ?? "");

    if (!program) {
      setError("Please select a program.");
      return;
    }

    const codes = rawCodes
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    const result = setSchema.safeParse({ program, yearLevel, codes });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    const inputs: CreateSetInput[] = result.data.codes.map((setCode) => ({
      program: result.data.program,
      yearLevel: result.data.yearLevel as YearLevel,
      setCode,
    }));

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
            defaultValue={set?.program ?? programs[0]?.abbrev}
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

      <FieldChrome id="set-year-level" label="Year Level">
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
      </FieldChrome>

      <Textarea
        id="set-code"
        label={isEdit ? "Set Code" : "Set Code(s)"}
        rows={isEdit ? 2 : 4}
        required
        defaultValue={set?.setCode ?? ""}
        hint={isEdit ? undefined : "One code per line — each line creates a separate set."}
      />

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
