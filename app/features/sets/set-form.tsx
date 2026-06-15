import { useState } from "react";
import { FormError } from "../../components/forms/form-error";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import type { Program } from "../../types/program";
import { setSchema } from "../../schemas/set.schema";
import { type ClassSet, type CreateSetInput } from "../../types/set";
import { YEAR_LEVEL_LABELS, YEAR_LEVELS, type YearLevel } from "../../types/subject";

type SetFormProps = {
  /** Provided when editing an existing set. */
  set?: ClassSet;
  programs: Program[];
  /** Called with one input per set code line (create); one item for edit. */
  onSubmit: (inputs: CreateSetInput[]) => Promise<void>;
  onCancel: () => void;
};

export function SetForm({ set, programs, onSubmit, onCancel }: SetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(set);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const program = String(data.get("set-program") ?? "").trim();
    const yearLevel = Number(data.get("set-year-level")) as YearLevel;
    const rawCodes = String(data.get("set-code") ?? "");

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
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <Select
        id="set-program"
        label="Program"
        defaultValue={set?.program ?? programs[0]?.code}
      >
        {programs.map((p) => (
          <option key={p.code} value={p.code}>
            {p.code} — {p.name}
          </option>
        ))}
      </Select>

      <Select
        id="set-year-level"
        label="Year Level"
        defaultValue={set?.yearLevel ?? 1}
      >
        {YEAR_LEVELS.map((year) => (
          <option key={year} value={year}>
            {YEAR_LEVEL_LABELS[year]}
          </option>
        ))}
      </Select>

      <Textarea
        id="set-code"
        label={isEdit ? "Set Code" : "Set Code(s)"}
        rows={isEdit ? 2 : 4}
        required
        placeholder={isEdit ? "A" : "A\nB\nC"}
        defaultValue={set?.setCode ?? ""}
        hint={isEdit ? undefined : "One code per line — each line creates a separate set."}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Add Sets"}
        </Button>
      </div>
    </form>
  );
}
