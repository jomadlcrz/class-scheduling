import { Alert, AlertDescription } from "~/components/ui/alert";
import { Card } from "~/components/ui/card";
import { HelpCircleIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { Program } from "~/types/program";

type CurriculumBuilderHeaderProps = {
  program: string;
  programs: Program[];
  onProgramChange: (abbrev: string) => void;
};

export function CurriculumBuilderHeader({
  program,
  programs,
  onProgramChange,
}: CurriculumBuilderHeaderProps) {
  return (
    <Card className="border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-surface-raised/80">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-sm">
          <FieldChrome id="curriculum-program" label="Program">
            <Select
              items={programs.map((p) => ({ value: p.abbrev, label: `${p.abbrev} — ${p.name}` }))}
              value={program}
              onValueChange={(v) => onProgramChange(v as string)}
            >
              <SelectTrigger id="curriculum-program">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            Select a program and year level, then expand a semester to build or edit the curriculum.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
}
