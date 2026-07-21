import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input, inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { programSchema } from "~/schemas/program.schema";
import type { Department } from "~/types/department";
import type { CreateProgramInput, Program } from "~/types/program";
import { PROGRAM_TYPE_YEARS, PROGRAM_TYPES } from "~/types/program";

type ProgramFormProps = {
  program?: Program;
  departments: Department[];
  onSubmit: (input: CreateProgramInput) => Promise<void>;
  onCancel: () => void;
};

export function ProgramForm({ program, departments, onSubmit, onCancel }: ProgramFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>(program?.type ?? PROGRAM_TYPES[0]);
  const isEdit = Boolean(program);
  const computedYears = PROGRAM_TYPE_YEARS[selectedType] ?? program?.lengthYears ?? 4;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    // The backend links programs to departments by name; not updatable afterwards.
    const departmentName = isEdit
      ? departments.find((d) => d.abbrev === program!.departmentAbbrev)?.name ?? "unchanged"
      : String(data.get("prog-department") ?? "");
    const abbrev = String(data.get("prog-abbrev") ?? "").trim().toUpperCase();
    const name = String(data.get("prog-name") ?? "").trim();
    const type = String(data.get("prog-type") ?? "");
    const lengthYears = PROGRAM_TYPE_YEARS[type] ?? computedYears;

    const result = programSchema.safeParse({ departmentName, abbrev, name, type, lengthYears });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  const defaultDeptName =
    departments.find((d) => d.abbrev === program?.departmentAbbrev)?.name ??
    departments[0]?.name ??
    "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <FieldChrome
        id="prog-department"
        label="Department"
        hint={isEdit ? "The department can't be changed after creation." : undefined}
      >
        <Select
          items={departments.map((d) => ({ value: d.name, label: `${d.abbrev} — ${d.name}` }))}
          name="prog-department"
          defaultValue={defaultDeptName}
          disabled={isEdit}
        >
          <SelectTrigger id="prog-department">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.name}>
                {d.abbrev} — {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="prog-abbrev"
          label="Program Abbrev"
          required
          placeholder="BSIS"
          defaultValue={program?.abbrev ?? ""}
        />
        <FieldChrome id="prog-type" label="Type">
          <Select
            items={PROGRAM_TYPES.map((t) => ({ value: t, label: t }))}
            name="prog-type"
            defaultValue={program?.type ?? PROGRAM_TYPES[0]}
            onValueChange={(v) => setSelectedType(v as string)}
          >
            <SelectTrigger id="prog-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROGRAM_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>
      <Input
        id="prog-name"
        label="Program Name"
        required
        placeholder="Bachelor of Science in Information Systems"
        defaultValue={program?.name ?? ""}
      />
      <FieldChrome id="prog-years" label="Length (Years)">
        <input
          id="prog-years"
          name="prog-years"
          type="number"
          value={computedYears}
          readOnly
          className={`${inputClassName} read-only:cursor-default read-only:bg-slate-100 read-only:dark:bg-white/10`}
        />
      </FieldChrome>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Add Program"}
        </Button>
      </div>
    </form>
  );
}
