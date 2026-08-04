import { Alert, AlertDescription } from "~/components/ui/alert";
import { Card } from "~/components/ui/card";
import { HelpCircleIcon } from "~/components/ui/icons";
import { FieldChrome, Input, inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { CurriculumBuilderMode } from "~/features/subjects/curriculum-builder-mode-toggle";
import type { Department } from "~/types/department";
import type { Program } from "~/types/program";
import { PROGRAM_TYPE_YEARS, PROGRAM_TYPES } from "~/types/program";

/** Sentinel program value that switches the header from "pick a program" to
 * "describe a new one" — the merged entry point for program + curriculum creation. */
export const NEW_PROGRAM_VALUE = "__new__";

export type NewProgramDraft = {
  departmentName: string;
  abbrev: string;
  name: string;
  type: string;
};

export function emptyNewProgramDraft(departments: Department[]): NewProgramDraft {
  return {
    departmentName: departments[0]?.name ?? "",
    abbrev: "",
    name: "",
    type: PROGRAM_TYPES[0],
  };
}

type CurriculumBuilderHeaderProps = {
  mode: CurriculumBuilderMode;
  program: string;
  programs: Program[];
  onProgramChange: (abbrev: string) => void;
  departments: Department[];
  newProgram: NewProgramDraft;
  onNewProgramChange: (patch: Partial<NewProgramDraft>) => void;
};

export function CurriculumBuilderHeader({
  mode,
  program,
  programs,
  onProgramChange,
  departments,
  newProgram,
  onNewProgramChange,
}: CurriculumBuilderHeaderProps) {
  const isNewProgram = program === NEW_PROGRAM_VALUE;
  const computedYears = PROGRAM_TYPE_YEARS[newProgram.type] ?? 4;

  return (
    <Card className="border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-surface-raised/80">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 lg:max-w-md">
          <FieldChrome id="curriculum-program" label="Program">
            <Select
              items={[
                { value: NEW_PROGRAM_VALUE, label: "+ New Program" },
                ...programs.map((p) => ({ value: p.abbrev, label: `${p.abbrev} — ${p.name}` })),
              ]}
              value={program}
              onValueChange={(v) => onProgramChange(v as string)}
            >
              <SelectTrigger id="curriculum-program">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NEW_PROGRAM_VALUE}>+ New Program</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.abbrev} value={p.abbrev}>
                    {p.abbrev} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>

          {isNewProgram && (
            <div className="mt-3 flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 p-3 dark:border-white/15">
              <div className="grid grid-cols-2 gap-3">
                <FieldChrome id="new-prog-department" label="Department">
                  <Select
                    items={departments.map((d) => ({ value: d.name, label: `${d.abbrev} — ${d.name}` }))}
                    value={newProgram.departmentName}
                    onValueChange={(v) => onNewProgramChange({ departmentName: v as string })}
                  >
                    <SelectTrigger id="new-prog-department">
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
                <Input
                  id="new-prog-abbrev"
                  label="Abbrev"
                  placeholder="BSIS"
                  value={newProgram.abbrev}
                  onChange={(e) => onNewProgramChange({ abbrev: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldChrome id="new-prog-type" label="Type">
                  <Select
                    items={PROGRAM_TYPES.map((t) => ({ value: t, label: t }))}
                    value={newProgram.type}
                    onValueChange={(v) => onNewProgramChange({ type: v as string })}
                  >
                    <SelectTrigger id="new-prog-type">
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
                <FieldChrome id="new-prog-years" label="Length (Years)">
                  <input
                    id="new-prog-years"
                    value={computedYears}
                    readOnly
                    className={`${inputClassName} read-only:cursor-default read-only:bg-slate-100 read-only:dark:bg-white/10`}
                  />
                </FieldChrome>
              </div>
              <Input
                id="new-prog-name"
                label="Program Name"
                placeholder="Bachelor of Science in Information Systems"
                value={newProgram.name}
                onChange={(e) => onNewProgramChange({ name: e.target.value })}
              />
            </div>
          )}
        </div>
        <Alert className="lg:max-w-md">
          <HelpCircleIcon />
          <AlertDescription>
            {isNewProgram
              ? "Fill in the program's details, then add at least one subject below to create it — programs and their first curriculum are created together."
              : mode === "edit"
                ? "Select a program and year level, then expand a semester to build or edit the curriculum."
                : "Review saved and unsaved subjects by year level and semester before saving."}
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
}
