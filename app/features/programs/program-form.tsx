import { useEffect, useState } from "react";
import { Link } from "react-router";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { ModalActions } from "~/components/ui/modal";
import { FieldChrome, Input, inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { programSchema } from "~/schemas/program.schema";
import { enumService } from "~/services/enum.service";
import type { Department } from "~/types/department";
import type { CreateProgramInput, Program } from "~/types/program";

type ProgramFormProps = {
  program?: Program;
  departments: Department[];
  onSubmit: (input: CreateProgramInput) => Promise<void>;
  onCancel: () => void;
};

export function ProgramForm({ program, departments, onSubmit, onCancel }: ProgramFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [degreeTypes, setDegreeTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>(program?.type ?? "");
  const [selectedDept, setSelectedDept] = useState<string>(
    departments.find((d) => d.abbrev === program?.departmentAbbrev)?.name ?? ""
  );
  const [lengthYears, setLengthYears] = useState(program?.lengthYears ?? 1);
  const isEdit = Boolean(program);
  const hasDepartments = departments.length > 0;

  useEffect(() => {
    enumService
      .getOptions()
      .then((options) => {
        setDegreeTypes(options.degreeType);
      })
      .catch(() => {});
  }, [program]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const departmentName = String(data.get("prog-department") ?? selectedDept ?? "").trim();
    const abbrev = String(data.get("prog-abbrev") ?? "").trim().toUpperCase();
    const name = String(data.get("prog-name") ?? "").trim();
    const type = String(data.get("prog-type") ?? selectedType ?? "").trim();

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
      setError(err instanceof Error ? err.message : "");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <FieldChrome id="prog-department" label="Department">
        {hasDepartments ? (
          <Select
            items={departments.map((d) => ({ value: d.name, label: `${d.abbrev} — ${d.name}` }))}
            name="prog-department"
            value={selectedDept || null}
            onValueChange={(v) => setSelectedDept((v as string) ?? "")}
          >
            <SelectTrigger id="prog-department">
              <SelectValue placeholder="Select department…" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.name}>
                  {d.abbrev} — {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <p className="font-medium text-navy-800 dark:text-mist-100">No departments available</p>
            <p>
              You need to configure at least one academic department first.{" "}
              <Link to="/departments" className="font-semibold text-blue-600 underline hover:text-blue-500 dark:text-blue-400">
                Go to Departments
              </Link>
            </p>
          </div>
        )}
      </FieldChrome>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="prog-abbrev"
          label="Program Abbrev"
          required
          autoCapitalize="characters"
          spellCheck={false}
          defaultValue={program?.abbrev.toUpperCase() ?? ""}
          onChange={(event) => {
            event.currentTarget.value = event.currentTarget.value.toUpperCase();
          }}
        />
        <FieldChrome id="prog-type" label="Type">
          <Select
            items={degreeTypes.map((t) => ({ value: t, label: t }))}
            name="prog-type"
            value={selectedType || null}
            onValueChange={(v) => setSelectedType((v as string) ?? "")}
          >
            <SelectTrigger id="prog-type">
              <SelectValue placeholder="Select program type…" />
            </SelectTrigger>
            <SelectContent>
              {degreeTypes.map((t) => (
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
        defaultValue={program?.name ?? ""}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="prog-years" className="font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
          Program Length (Years)
        </label>
        <input
          id="prog-years"
          type="number"
          inputMode="numeric"
          min={1}
          max={10}
          value={lengthYears === 0 ? "" : lengthYears}
          onKeyDown={(e) => {
            if (["e", "E", "+", "-", "."].includes(e.key)) {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            const clean = e.target.value.replace(/[^0-9]/g, "");
            const num = clean === "" ? 0 : parseInt(clean, 10);
            setLengthYears(Number.isNaN(num) ? 0 : num);
          }}
          className={inputClassName}
        />
      </div>

      <ModalActions>
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          block={false}
          disabled={!hasDepartments || isLoading}
          isLoading={isLoading}
          loadingLabel="Saving…"
        >
          {isEdit ? "Save Changes" : "Create Program"}
        </Button>
      </ModalActions>
    </form>
  );
}
