import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input } from "~/components/ui/input";
import { ModalActions } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { setSchema } from "~/schemas/set.schema";
import type { Program } from "~/types/program";
import type { ClassSet, CreateSetInput } from "~/types/set";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { YearLevel } from "~/types/subject";

type SetFormProps = {
  set: ClassSet;
  programs: Program[];
  onSubmit: (inputs: CreateSetInput[]) => Promise<void>;
  onCancel: () => void;
};

const SET_CODE_MAX_LENGTH = 20;

const readOnlyFieldClassName =
  "block w-full cursor-default rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-body text-sm text-navy-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-mist-100";

export function SetForm({ set, programs, onSubmit, onCancel }: SetFormProps) {
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrolledThisTerm = set.studentCount ?? 0;
  const yearLevelLocked = enrolledThisTerm > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const program = set.program;
    const yearLevel = (yearLevelLocked
      ? set.yearLevel
      : Number(data.get("set-year-level"))) as YearLevel;
    const rawCode = String(data.get("set-code") ?? "").trim();

    const result = setSchema.safeParse({ program, yearLevel, codes: [rawCode] });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid section code.");
      return;
    }

    const inputs: CreateSetInput[] = [
      {
        program,
        yearLevel,
        setCode: rawCode,
      },
    ];

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(inputs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update section.");
      setIsLoading(false);
    }
  }

  const programMatch = programs.find((p) => p.abbrev === set.program);
  const programLabel = programMatch ? `${set.program} — ${programMatch.name}` : set.program;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <FieldChrome id="set-program" label="Program">
        <input
          id="set-program"
          name="set-program"
          type="text"
          readOnly
          value={programLabel}
          className={readOnlyFieldClassName}
        />
      </FieldChrome>

      <FieldChrome
        id="set-year-level"
        label="Year level"
        hint={
          yearLevelLocked
            ? `${enrolledThisTerm} ${enrolledThisTerm === 1 ? "student is" : "students are"} enrolled in this section, so its year level is fixed. Only a section with no students and no schedules can be moved.`
            : "Only a section with no students and no schedules can be moved to another year level."
        }
      >
        {yearLevelLocked ? (
          <input
            id="set-year-level"
            name="set-year-level-display"
            type="text"
            readOnly
            value={yearLevelLabel(set.yearLevel)}
            className={readOnlyFieldClassName}
          />
        ) : (
          <Select
            items={yearLevelIds.map((year) => ({ value: year, label: yearLevelLabel(year) }))}
            name="set-year-level"
            defaultValue={set.yearLevel}
          >
            <SelectTrigger id="set-year-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearLevelIds.map((year) => (
                <SelectItem key={year} value={year}>
                  {yearLevelLabel(year)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FieldChrome>

      <Input
        id="set-code"
        name="set-code"
        label="Set code"
        required
        placeholder="A"
        defaultValue={set.setCode}
        maxLength={SET_CODE_MAX_LENGTH}
        autoComplete="off"
      />

      <ModalActions>
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          Save changes
        </Button>
      </ModalActions>
    </form>
  );
}
