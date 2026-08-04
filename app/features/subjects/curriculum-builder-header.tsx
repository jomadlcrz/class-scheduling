import { motion, useReducedMotion } from "motion/react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Card } from "~/components/ui/card";
import { ArrowLeftIcon, HelpCircleIcon } from "~/components/ui/icons";
import { FieldChrome, Input, inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { TextButton } from "~/components/ui/text-button";
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
  if (program === NEW_PROGRAM_VALUE) {
    return (
      <NewProgramPanel
        programs={programs}
        departments={departments}
        newProgram={newProgram}
        onNewProgramChange={onNewProgramChange}
        onUseExisting={() => onProgramChange(programs[0]?.abbrev ?? "")}
      />
    );
  }

  return (
    <Card className="border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-surface-raised/80">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-sm flex-1">
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
        </div>
        <Alert className="lg:max-w-md">
          <HelpCircleIcon />
          <AlertDescription>
            {mode === "edit"
              ? "Select a program and year level, then expand a semester to build or edit the curriculum."
              : "Review saved and unsaved subjects by year level and semester before saving."}
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
}

type NewProgramPanelProps = {
  programs: Program[];
  departments: Department[];
  newProgram: NewProgramDraft;
  onNewProgramChange: (patch: Partial<NewProgramDraft>) => void;
  onUseExisting: () => void;
};

function NewProgramPanel({
  programs,
  departments,
  newProgram,
  onNewProgramChange,
  onUseExisting,
}: NewProgramPanelProps) {
  const reduceMotion = useReducedMotion();
  const computedYears = PROGRAM_TYPE_YEARS[newProgram.type] ?? 4;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-surface-raised/80 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <p className="font-body text-xs font-semibold tracking-wider text-gold-600 uppercase dark:text-gold-400">
              New Program
            </p>
            {programs.length > 0 && (
              <TextButton onClick={onUseExisting}>
                <span className="inline-flex items-center gap-1">
                  <ArrowLeftIcon />
                  Use an existing program
                </span>
              </TextButton>
            )}
          </div>

          <div>
            <label htmlFor="new-prog-name" className="sr-only">
              Program name
            </label>
            <input
              id="new-prog-name"
              value={newProgram.name}
              onChange={(e) => onNewProgramChange({ name: e.target.value })}
              placeholder="Untitled Program"
              className="w-full border-0 border-b-2 border-slate-200 bg-transparent pb-2 font-display text-2xl tracking-wide text-navy-700 outline-none transition-colors duration-150 placeholder:text-slate-300 focus:border-gold-400 dark:border-white/15 dark:text-mist-100 dark:placeholder:text-slate-600 dark:focus:border-gold-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FieldChrome id="new-prog-department" label="Department" required>
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
              required
              value={newProgram.abbrev}
              onChange={(e) => onNewProgramChange({ abbrev: e.target.value.toUpperCase() })}
              placeholder="BSIS"
            />
            <FieldChrome id="new-prog-type" label="Type" required>
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
                className={`${inputClassName} read-only:cursor-default read-only:bg-slate-100 dark:read-only:bg-white/10`}
              />
            </FieldChrome>
          </div>

          <p className="font-body text-xs text-slate-400 dark:text-slate-500">
            Add at least one subject below to create it — a program and its first curriculum save together.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
